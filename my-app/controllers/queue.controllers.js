const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const Token = require("../models/Token");
const QueueCounter = require("../models/QueueCounter");
const Department = require("../models/Department");
const Hospital = require("../models/Hospital");
const QueueService = require("../services/QueueService");

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

  // Verify hospital and department exist
  const [hospital, department] = await Promise.all([
    Hospital.findById(hospitalId),
    Department.findById(departmentId),
  ]);

  if (!hospital) throw new ApiError(404, "Hospital not found");
  if (!department) throw new ApiError(404, "Department not found");
  if (String(department.hospital) !== String(hospitalId)) {
    throw new ApiError(400, "Department does not belong to this hospital");
  }

  // Check if patient already has an active token in this department
  const existingToken = await Token.findOne({
    patientId,
    departmentId,
    status: { $in: ["WAITING", "CALLED"] },
  });

  if (existingToken) {
    throw new ApiError(409, "You already have an active token in this department");
  }

  // Delegate to QueueService to guarantee atomic creation and emit
  const queueService = new QueueService(req.app.locals.eventPublisher);
  const newToken = await queueService.createToken(patientId, departmentId, hospitalId, priority);

  // Count patients currently waiting ahead of this one
  const waitingCount = await Token.countDocuments({
    hospitalId,
    departmentId,
    status: "WAITING",
    tokenNumber: { $lt: newToken.tokenNumber },
  });

  // Calculate estimated wait time
  const avgWaitMins = department.avgConsultationTime || 5;
  const estimatedWait = waitingCount * avgWaitMins;

  newToken.estimatedWait = estimatedWait;
  await newToken.save();

  return res.status(201).json(
      token: populatedToken,
      tokenNumber,
      estimatedWait,
      patientsAhead: waitingCount,
    }, "Token booked successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT: Get status of their active token
// GET /api/queue/status?departmentId=xxx
// ─────────────────────────────────────────────────────────────────────────────
const getPatientTokenStatus = asyncHandler(async (req, res) => {
  const patientId = req.user._id;
  const { departmentId } = req.query;

  // Get the patient's active token (WAITING or CALLED)
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

  // Get the token currently being CALLED (the one at the desk)
  const currentCalledToken = await Token.findOne({
    hospitalId: myToken.hospitalId,
    departmentId: myToken.departmentId,
    status: "CALLED",
  }).sort({ tokenNumber: 1 });

  // Count patients ahead (lower token numbers that are still WAITING)
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
// GET /api/queue/my-tokens
// ─────────────────────────────────────────────────────────────────────────────
const getMyTokens = asyncHandler(async (req, res) => {
  const patientId = req.user._id;

  const tokens = await Token.find({ patientId })
    .populate("hospitalId", "name address")
    .populate("departmentId", "name")
    .sort({ createdAt: -1 })
    .limit(50);

  return res.status(200).json(
    new ApiResponse(200, tokens, "Token history fetched")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT: Cancel own WAITING token
// PATCH /api/queue/token/:id/cancel
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
// GET /api/queue/department?hospitalId=xxx&departmentId=xxx
// ─────────────────────────────────────────────────────────────────────────────
const getQueueByDepartment = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId } = req.query;

  if (!hospitalId || !departmentId) {
    throw new ApiError(400, "hospitalId and departmentId are required");
  }

  // Fetch active queue: WAITING and CALLED tokens, EMERGENCY first, then by token number
  const queue = await Token.find({
    hospitalId,
    departmentId,
    status: { $in: ["WAITING", "CALLED"] },
  })
    .populate("patientId", "name email phone")
    .sort({ priority: -1, tokenNumber: 1 }); // EMERGENCY sorts before NORMAL (desc)

  const stats = await _getStats(hospitalId, departmentId);

  return res.status(200).json(
    new ApiResponse(200, { queue, stats }, "Queue fetched successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION: Call Next patient
// POST /api/queue/call-next
// ─────────────────────────────────────────────────────────────────────────────
const callNext = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId, counterId } = req.body;

  if (!hospitalId || !departmentId) {
    throw new ApiError(400, "hospitalId and departmentId are required");
  }

  // Mark any currently CALLED token as COMPLETED first
  await Token.updateMany(
    { hospitalId, departmentId, status: "CALLED" },
    { $set: { status: "COMPLETED", completedAt: new Date() } }
  );

  const queueService = new QueueService(req.app.locals.eventPublisher);
  
  try {
    const nextToken = await queueService.callNextToken(departmentId, counterId);
    return res.status(200).json(
      new ApiResponse(200, nextToken, `Token ${nextToken.tokenNumber} called`)
    );
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(200).json(
        new ApiResponse(200, null, "No more patients in queue")
      );
    }
    throw error;
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION: Complete a token
// PATCH /api/queue/token/:id/complete
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

  return res.status(200).json(
    new ApiResponse(200, token, "Token completed")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION: Skip a token
// PATCH /api/queue/token/:id/skip
// ─────────────────────────────────────────────────────────────────────────────
const skipToken = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const queueService = new QueueService(req.app.locals.eventPublisher);
  
  const token = await queueService.skipToken(id);

  return res.status(200).json(
    new ApiResponse(200, token, "Token skipped")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// RECEPTION: Recall a skipped token
// POST /api/queue/recall
// ─────────────────────────────────────────────────────────────────────────────
const recallToken = asyncHandler(async (req, res) => {
  const { tokenId } = req.body;
  
  if (!tokenId) {
    throw new ApiError(400, "tokenId is required");
  }

  const queueService = new QueueService(req.app.locals.eventPublisher);
  const token = await queueService.recallToken(tokenId);

  return res.status(200).json(
    new ApiResponse(200, token, "Token recalled to waiting state")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// SHARED: Queue Statistics
// GET /api/queue/stats?hospitalId=xxx&departmentId=xxx
// ─────────────────────────────────────────────────────────────────────────────
const getQueueStats = asyncHandler(async (req, res) => {
  const { hospitalId, departmentId } = req.query;

  if (!hospitalId || !departmentId) {
    throw new ApiError(400, "hospitalId and departmentId are required");
  }

  const stats = await _getStats(hospitalId, departmentId);

  return res.status(200).json(
    new ApiResponse(200, stats, "Stats fetched successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// INTERNAL helper — reusable stats aggregation (Socket.io-ready)
// ─────────────────────────────────────────────────────────────────────────────
const _getStats = async (hospitalId, departmentId) => {
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

  return {
    waiting,
    called,
    completed,
    skipped,
    cancelled,
    avgWaitTime,
    departmentName: dept?.name,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// DOCTOR: Get the queue for a specific hospital + department
// GET /api/queue/doctor-queue?hospitalId=xxx&departmentId=xxx
// Doctors view their assigned dept queue (read-only)
// SOCKET.IO UPGRADE: subscribe to dept:${departmentId} room events
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
      .limit(20),

    // Today's completed count
    Token.countDocuments({
      hospitalId,
      departmentId,
      status: "COMPLETED",
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
