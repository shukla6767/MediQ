const Token = require("../models/Token");
const Department = require("../models/Department");
const QueueCounter = require("../models/QueueCounter");
const { ApiError } = require("../utils/ApiError");

/**
 * ============================================================================
 * QUEUE SERVICE (THE CORE ENGINE)
 * ============================================================================
 * What this file does:
 * This is the most critical file in the backend. It handles all the complex logic 
 * for creating, moving, and skipping tokens in the queue.
 * 
 * Why relies on Atomic Operations?
 * If two Receptionists click "Call Next" at the exact same millisecond, we MUST ensure
 * they don't both accidentally call Patient #12. We use MongoDB's `findOneAndUpdate`
 * which acts as an "Atomic Lock". It guarantees that the database completely processes 
 * one update before it even looks at the next one.
 */
class QueueService {
  /**
   * Dependency Injection
   * By passing the `eventPublisher` into the constructor, this service can broadcast
   * WebSockets to the frontend without actually knowing how WebSockets work!
   */
  constructor(eventPublisher) {
    this.eventPublisher = eventPublisher;
  }

  /**
   * Helper: Generates the specific WebSocket room name for a department.
   */
  getChannel(departmentId) {
    return `department:${departmentId}`;
  }

  /**
   * Atomically calls the next waiting token.
   * 
   * @param {string} departmentId - Which queue to pull from
   * @param {string} counterId - Which receptionist desk clicked the button
   */
  async callNextToken(departmentId, counterId) {
    // 1. ATOMIC UPDATE
    // Finds the oldest WAITING token (sorted by priority, then token number).
    // Instantly changes it to CALLED. Returns the newly updated document (`new: true`).
    const token = await Token.findOneAndUpdate(
      {
        department: departmentId,
        status: "WAITING"
      },
      {
        $set: {
          status: "CALLED",
          calledAt: new Date(),
          calledByCounter: counterId
        }
      },
      {
        sort: { priority: 1, tokenNumber: 1 }, // Sort: EMERGENCY first, then #1, #2, #3
        new: true,
        populate: "patientId"
      }
    );

    if (!token) {
      throw new ApiError(404, "No patients waiting in queue");
    }

    // 2. BROADCAST REAL-TIME UPDATE
    // Instantly tell all browser screens in the waiting room to update their UI
    this.eventPublisher.publish(
      this.getChannel(departmentId),
      "queue:token_called",
      {
        tokenNumber: token.tokenNumber,
        departmentId: token.department,
        counterId: counterId,
        status: token.status,
        calledAt: token.calledAt
      }
    );

    // 3. BACKGROUND REMINDER INJECTION (Feature 3)
    // We check if there is a patient exactly 10 spots away.
    const tenthPatient = await Token.findOne({
      department: departmentId,
      status: "WAITING"
    })
      .sort({ priority: 1, tokenNumber: 1 })
      .skip(9) // Skip the first 9 people, grab the 10th
      .populate("patientId");

    // If a 10th person exists, push a job to the background queue.
    // Notice we do NOT use `await` on `enqueueReminder`. The Receptionist's API request 
    // will finish instantly, and the reminder job happens silently in the background!
    if (tenthPatient && tenthPatient.patientId && tenthPatient.patientId.phone) {
      const { enqueueReminder } = require("../jobs/reminder.producer");
      enqueueReminder({
        phoneNumber: tenthPatient.patientId.phone,
        patientName: tenthPatient.patientId.name,
        tokenNumber: tenthPatient.tokenNumber,
        patientsAhead: 10
      }).catch(err => console.error("[Reminder Injection Error]", err));
    }

    return token;
  }

  /**
   * Skips a token (e.g., patient is absent when called)
   */
  async skipToken(tokenId) {
    const token = await Token.findOneAndUpdate(
      {
        _id: tokenId,
        status: "CALLED" // Security check: Only a CALLED token can be skipped
      },
      {
        $set: { status: "SKIPPED" }
      },
      { new: true }
    );

    if (!token) {
      throw new ApiError(400, "Token is not in CALLED state or does not exist");
    }

    // Tell the frontend screens to remove them from the "Currently Calling" board
    this.eventPublisher.publish(
      this.getChannel(token.department),
      "queue:token_skipped",
      {
        tokenNumber: token.tokenNumber,
        departmentId: token.department,
        status: token.status
      }
    );

    return token;
  }

  /**
   * Recalls a token (bringing it back from SKIPPED to WAITING)
   */
  async recallToken(tokenId) {
    const token = await Token.findOneAndUpdate(
      {
        _id: tokenId,
        status: "SKIPPED" 
      },
      {
        // Revert it to waiting, and erase the history of it being called
        $set: { status: "WAITING", calledAt: null, calledByCounter: null }
      },
      { new: true }
    );

    if (!token) {
      throw new ApiError(400, "Only skipped tokens can be recalled");
    }

    // Tell frontend to re-add them to the waiting list
    this.eventPublisher.publish(
      this.getChannel(token.department),
      "queue:token_recalled",
      {
        tokenNumber: token.tokenNumber,
        departmentId: token.department,
        status: token.status
      }
    );

    return token;
  }

  /**
   * Creates a new token (equivalent to patient joining queue)
   */
  async createToken(patientId, departmentId, hospitalId, priority = "NORMAL") {
    // 1. ATOMIC INCREMENT FOR TOKEN NUMBER
    // We cannot just do `count = Token.length + 1` because if two people book at the same time,
    // they would both get Token #5. We use a dedicated QueueCounter collection and `$inc`.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counter = await QueueCounter.findOneAndUpdate(
      { department: departmentId, date: today },
      { $inc: { count: 1 }, $setOnInsert: { hospital: hospitalId } },
      { new: true, upsert: true } // upsert creates the counter if this is the first patient of the day
    );

    // 2. Create the physical token record
    const newToken = await Token.create({
      tokenNumber: counter.count,
      patientId: patientId,
      department: departmentId,
      hospital: hospitalId,
      priority: priority,
      status: "WAITING"
    });

    // Populate patient info so we can broadcast their name to the Receptionist
    await newToken.populate("patientId", "name email");

    // 3. Inform all Receptionists in this department that a new patient just arrived
    this.eventPublisher.publish(
      this.getChannel(departmentId),
      "queue:patient_turn",
      {
        tokenNumber: newToken.tokenNumber,
        departmentId: newToken.department,
        status: newToken.status,
        patientName: newToken.patientId?.name,
        priority: newToken.priority
      }
    );

    return newToken;
  }
}

module.exports = QueueService;
