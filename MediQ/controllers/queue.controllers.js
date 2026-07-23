const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const Token = require("../models/Token");
const QueueCounter = require("../models/QueueCounter");
const Department = require("../models/Department");
const Hospital = require("../models/Hospital");
const HospitalService = require("../services/HospitalService");
const QueueService = require("../services/QueueService");
const { enqueueSms } = require("../jobs/sms.producer");
const { enqueueWhatsapp } = require("../jobs/whatsapp.producer");
const redisConnection = require("../config/redis");

/**
 * ============================================================================
 * QUEUE CONTROLLERS
 * ============================================================================
 * What this file does:
 * Handles incoming API requests for Booking, Calling, Skipping, and Cancelling tokens.
 * 
 * Why it is structured this way:
 * It explicitly isolates "Request Validation" from "Business Logic".
 * 1. Checks if the URL parameters and body data are valid.
 * 2. If valid, passes them down to `QueueService.js`.
 * 3. Takes the answer from `QueueService.js` and formats it into an HTTP JSON response.
 */

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT: Book a token
// POST /api/queue/book
// ─────────────────────────────────────────────────────────────────────────────
const bookToken = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId, priority = "NORMAL" } = req.body;
  const patientId = req.user._id;

  if (!hospitalId || !departmentId) {
    throw new ApiError(400, "hospitalId and departmentId are required");
  }

  // Verify hospital and department exist simultaneously
  const [hospital, department] = await Promise.all([
    Hospital.findById(hospitalId),
    Department.findById(departmentId),
  ]);

  if (!hospital) throw new ApiError(404, "Hospital not found");
  if (!department) throw new ApiError(404, "Department not found");
  if (String(department.hospital) !== String(hospitalId)) {
    throw new ApiError(400, "Department does not belong to this hospital");
  }

  // Prevent spam: A patient can only have one active token in a department at a time
  const existingToken = await Token.findOne({
    patientId,
    departmentId,
    status: { $in: ["WAITING", "CALLED"] },
  });

  if (existingToken) {
    throw new ApiError(409, "You already have an active token in this department");
  }

  // Delegate the incredibly complex atomic token generation to QueueService
  const queueService = new QueueService(req.app.locals.eventPublisher);
  const newToken = await queueService.createToken(patientId, departmentId, hospitalId, priority);

  // Count patients currently waiting AHEAD of this new token
  const waitingCount = await Token.countDocuments({
    hospitalId,
    departmentId,
    status: "WAITING",
    tokenNumber: { $lt: newToken.tokenNumber }, // `$lt` means "Less Than"
  });

  const avgWaitMins = department.avgConsultationTime || 5;
  const estimatedWait = waitingCount * avgWaitMins;

  newToken.estimatedWait = estimatedWait;
  await newToken.save();

  // Background Processing: Hand off the SMS/WhatsApp notifications to BullMQ workers
  if (req.user.phone) {
    const message = `Hello ${req.user.name}, your token #${newToken.tokenNumber} is booked. Estimated wait: ${estimatedWait} minutes.`;
    
    // Notice no `await`! This fires into memory in <1ms so the patient doesn't have to wait.
    enqueueSms({ phoneNumber: req.user.phone, message });
    enqueueWhatsapp({ phoneNumber: req.user.phone, message });
  }

  return res.status(201).json(
    new ApiResponse(201, {
      token: newToken,
      tokenNumber: newToken.tokenNumber,
      estimatedWait,
      patientsAhead: waitingCount,
    }, "Token booked successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT: Get status of their active token
// ─────────────────────────────────────────────────────────────────────────────
const getPatientTokenStatus = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { departmentId } = req.query;

  // Find their single currently active token
  const query = { patientId, status: { $in: ["WAITING", "CALLED"] } };
  if (departmentId) query.departmentId = departmentId;

  const myToken = await Token.findOne(query)
    .populate("hospitalId", "name address")
    .populate("departmentId", "name avgConsultationTime")
    .sort({ createdAt: -1 });

  if (!myToken) {
    return res.status(200).json(
      new ApiResponse(200, { hasActiveToken: false }, "No active token found")
    );
  }

  // Find out who is currently standing at the doctor's desk
  const currentCalledToken = await Token.findOne({
    hospitalId: myToken.hospitalId,
    departmentId: myToken.departmentId,
    status: "CALLED",
  }).sort({ tokenNumber: 1 });

  // Calculate exactly how many people are physically ahead of them right now
  const patientsAhead = await Token.countDocuments({
    hospitalId: myToken.hospitalId,
    departmentId: myToken.departmentId,
    status: "WAITING",
    $or: [
      { priority: "EMERGENCY", tokenNumber: { $lt: myToken.tokenNumber } },
      { priority: "NORMAL", tokenNumber: { $lt: myToken.tokenNumber } },
    ],
  });

  const dept = myToken.departmentId;
  const estimatedWait = patientsAhead * (dept?.avgConsultationTime || 5);

  return res.status(200).json(
    new ApiResponse(200, {
      hasActiveToken: true,
      yourToken: myToken.tokenNumber,
      yourStatus: myToken.status,
      priority: myToken.priority,
      currentCalledToken: currentCalledToken?.tokenNumber || null,
      patientsAhead,
      estimatedWait,
      hospital: myToken.hospitalId,
      department: myToken.departmentId,
      tokenId: myToken._id,
      bookedAt: myToken.createdAt,
    }, "Token status fetched")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT: Get full token history
// ─────────────────────────────────────────────────────────────────────────────
const getMyTokens = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  const tokens = await Token.find({ patientId })
    .populate("hospitalId", "name address")
    .populate("departmentId", "name")
    .sort({ createdAt: -1 })
    .limit(50); // Hard limit to prevent enormous JSON payloads

  return res.status(200).json(
    new ApiResponse(200, tokens, "Token history fetched")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT: Cancel own WAITING token
// ─────────────────────────────────────────────────────────────────────────────
const cancelToken = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { id } = req.params;

  const token = await Token.findOne({ _id: id, patientId });
  if (!token) throw new ApiError(404, "Token not found");
  if (token.status !== "WAITING") {
    throw new ApiError(400, "Only WAITING tokens can be cancelled");
  }

  token.status = "CANCELLED";
  await token.save();

  // Notify the waiting room dashboard to remove their token from the screen
  const queueService = new QueueService(req.app.locals.eventPublisher);
  queueService.eventPublisher.publish(
    queueService.getChannel(token.departmentId || token.department),
    "queue:queue_updated",
    { tokenNumber: token.tokenNumber, status: "CANCELLED" }
  );

  return res.status(200).json(
    new ApiResponse(200, token, "Token cancelled successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION: Get full queue for a department
// ─────────────────────────────────────────────────────────────────────────────
const getQueueByDepartment = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId, page = 1, limit = 50 } = req.query;

  if (!hospitalId || !departmentId) {
    throw new ApiError(400, "hospitalId and departmentId are required");
  }

  // Pagination logic (skip/limit is the industry standard for APIs)
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const query = {
    hospitalId,
    departmentId,
    status: { $in: ["WAITING", "CALLED"] },
  };

  const [queue, total] = await Promise.all([
    Token.find(query)
      .populate("patientId", "name email phone")
      // Sort priority: -1 means EMERGENCY (which is alphabetically higher than NORMAL) comes first.
      .sort({ priority: -1, tokenNumber: 1 }) 
      .skip(skip)
      .limit(limitNum),
    Token.countDocuments(query)
  ]);

  const stats = await _getStats(hospitalId, departmentId);

  const pagination = {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum)
  };

  return res.status(200).json(
    new ApiResponse(200, { queue, stats, pagination }, "Queue fetched successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION: Call Next patient
// ─────────────────────────────────────────────────────────────────────────────
const callNext = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId, counterId } = req.body;

  if (!hospitalId || !departmentId) {
    throw new ApiError(400, "hospitalId and departmentId are required");
  }

  // If there's a patient currently at the desk, mark them COMPLETED automatically 
  // so we don't have overlapping "CALLED" patients.
  await Token.updateMany(
    { hospitalId, departmentId, status: "CALLED" },
    { $set: { status: "COMPLETED", completedAt: new Date() } }
  );

  const queueService = new QueueService(req.app.locals.eventPublisher);
  
  try {
    // Attempt the atomic lock
    const nextToken = await queueService.callNextToken(departmentId, counterId);
    return res.status(200).json(
      new ApiResponse(200, nextToken, `Token ${nextToken.tokenNumber} called`)
    );
  } catch (error) {
    // Graceful error handling if the queue is empty
    if (error.statusCode === 404) {
      return res.status(200).json(
        new ApiResponse(200, null, "No more patients in queue")
      );
    }
    throw error;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION: Complete a token manually
// ─────────────────────────────────────────────────────────────────────────────
const completeToken = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const token = await Token.findById(id);
  if (!token) throw new ApiError(404, "Token not found");
  if (token.status !== "CALLED") {
    throw new ApiError(400, "Only CALLED tokens can be marked as completed");
  }

  token.status = "COMPLETED";
  token.completedAt = new Date();
  await token.save();

  const queueService = new QueueService(req.app.locals.eventPublisher);
  queueService.eventPublisher.publish(
    queueService.getChannel(token.departmentId || token.department),
    "queue:queue_updated",
    { tokenNumber: token.tokenNumber, status: "COMPLETED" }
  );

  return res.status(200).json(new ApiResponse(200, token, "Token completed"));
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION: Skip a token manually
// ─────────────────────────────────────────────────────────────────────────────
const skipToken = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queueService = new QueueService(req.app.locals.eventPublisher);
  
  const token = await queueService.skipToken(id);

  return res.status(200).json(new ApiResponse(200, token, "Token skipped"));
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION: Recall a skipped token
// ─────────────────────────────────────────────────────────────────────────────
const recallToken = asyncHandler(async (req, res) => {
  const { tokenId } = req.body;
  
  if (!tokenId) throw new ApiError(400, "tokenId is required");

  const queueService = new QueueService(req.app.locals.eventPublisher);
  const token = await queueService.recallToken(tokenId);

  return res.status(200).json(new ApiResponse(200, token, "Token recalled to waiting state"));
});

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Queue Statistics
// ─────────────────────────────────────────────────────────────────────────────
const getQueueStats = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId } = req.query;

  if (!hospitalId || !departmentId) {
    throw new ApiError(400, "hospitalId and departmentId are required");
  }

  const stats = await _getStats(hospitalId, departmentId);

  return res.status(200).json(new ApiResponse(200, stats, "Stats fetched successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL HELPER: Caches heavy queries in Redis
// ─────────────────────────────────────────────────────────────────────────────
const _getStats = async (hospitalId, departmentId) => {
  const CACHE_KEY = `queue_stats:${hospitalId}:${departmentId}`;

  // 1. Try Redis Cache first
  const cachedStats = await redisConnection.get(CACHE_KEY);
  if (cachedStats) return JSON.parse(cachedStats);

  // 2. Cache Miss - Calculate from MongoDB
  const baseQuery = { hospitalId, departmentId };

  const [waiting, called, completed, skipped, cancelled, dept] = await Promise.all([
    Token.countDocuments({ ...baseQuery, status: "WAITING" }),
    Token.countDocuments({ ...baseQuery, status: "CALLED" }),
    Token.countDocuments({ ...baseQuery, status: "COMPLETED" }),
    Token.countDocuments({ ...baseQuery, status: "SKIPPED" }),
    Token.countDocuments({ ...baseQuery, status: "CANCELLED" }),
    Department.findById(departmentId).select("avgConsultationTime name"),
  ]);

  const avgWaitTime = waiting * (dept?.avgConsultationTime || 5);

  const stats = {
    waiting, called, completed, skipped, cancelled, avgWaitTime, departmentName: dept?.name,
  };

  // 3. Store in Redis with 15-second TTL
  // Extremely short TTL guarantees real-time feel while completely eliminating rapid DB spikes
  await redisConnection.setex(CACHE_KEY, 15, JSON.stringify(stats));

  return stats;
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR: Get the queue for a specific hospital + department
// ─────────────────────────────────────────────────────────────────────────────
const getDoctorQueue = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId } = req.query;

  if (!hospitalId || !departmentId) {
    throw new ApiError(400, "hospitalId and departmentId are required");
  }

  const [calledToken, waitingTokens, todayStats] = await Promise.all([
    Token.findOne({ hospitalId, departmentId, status: "CALLED" })
      .populate("patientId", "name email phone")
      .sort({ calledAt: -1 }),

    Token.find({ hospitalId, departmentId, status: "WAITING" })
      .populate("patientId", "name email")
      .sort({ priority: -1, tokenNumber: 1 })
      .limit(20), // Doctors only need to see the next 20 people

    // Today's completed count
    Token.countDocuments({
      hospitalId, departmentId, status: "COMPLETED",
      completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    }),
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      calledToken,
      waitingTokens,
      waitingCount: waitingTokens.length,
      completedToday: todayStats,
    }, "Doctor queue fetched")
  );
});

module.exports = {
  bookToken,
  getPatientTokenStatus,
  getMyTokens,
  cancelToken,
  getQueueByDepartment,
  getDoctorQueue,
  callNext,
  completeToken,
  skipToken,
  recallToken,
  getQueueStats,
};
