const Token = require("../models/Token");
const Department = require("../models/Department");
const QueueCounter = require("../models/QueueCounter");
const { ApiError } = require("../utils/ApiError");

/**
 * QueueService encapsulates all business logic for queue manipulation.
 * It strictly relies on atomic database operations for concurrency safety.
 */
class QueueService {
  constructor(eventPublisher) {
    this.eventPublisher = eventPublisher;
  }

  /**
   * Helper: Generate specific channel names
   */
  getChannel(departmentId) {
    return `department:${departmentId}`;
  }

  /**
   * Atomically calls the next waiting token.
   * Prevents duplicates if multiple receptionists click simultaneously.
   */
  async callNextToken(departmentId, counterId) {
    // We use findOneAndUpdate to atomically lock and update the record.
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
        sort: { priority: 1, tokenNumber: 1 }, // Priority first, then oldest waiting
        new: true,
        populate: "patientId"
      }
    );

    if (!token) {
      throw new ApiError(404, "No patients waiting in queue");
    }

    // Publish event
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

    return token;
  }

  /**
   * Skips a token (e.g., patient is absent)
   */
  async skipToken(tokenId) {
    const token = await Token.findOneAndUpdate(
      {
        _id: tokenId,
        status: "CALLED" // Only a called token can be skipped
      },
      {
        $set: { status: "SKIPPED" }
      },
      { new: true }
    );

    if (!token) {
      throw new ApiError(400, "Token is not in CALLED state or does not exist");
    }

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
        $set: { status: "WAITING", calledAt: null, calledByCounter: null }
      },
      { new: true }
    );

    if (!token) {
      throw new ApiError(400, "Only skipped tokens can be recalled");
    }

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
    // Atomically increment counter for this department/date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const counter = await QueueCounter.findOneAndUpdate(
      { department: departmentId, date: today },
      { $inc: { count: 1 }, $setOnInsert: { hospital: hospitalId } },
      { new: true, upsert: true }
    );

    const newToken = await Token.create({
      tokenNumber: counter.count,
      patientId: patientId,
      department: departmentId,
      hospital: hospitalId,
      priority: priority,
      status: "WAITING"
    });

    // Populate patient info for broadcast
    await newToken.populate("patientId", "name email");

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
