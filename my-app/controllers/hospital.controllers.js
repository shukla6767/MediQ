const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const Token = require("../models/Token");
const User = require("../models/User");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals — All hospitals with department count
// REDIS CACHE POINT: cache for 60s with key "hospitals:all"
// ─────────────────────────────────────────────────────────────────────────────
const getAllHospitals = asyncHandler(async (req, res) => {
  const hospitals = await Hospital.aggregate([
    {
      $lookup: {
        from: "departments",
        localField: "_id",
        foreignField: "hospital",
        as: "departments",
      },
    },
    {
      $addFields: {
        departmentCount: { $size: "$departments" },
        departmentNames: "$departments.name",
      },
    },
    {
      $project: {
        departments: 0, // don't send full dept objects, just count + names
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return res.status(200).json(new ApiResponse(200, hospitals, "Hospitals fetched successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/search?q=keyword — Full-text search on hospitals
// REDIS CACHE POINT: cache for 30s with key `hospitals:search:${q}`
// ─────────────────────────────────────────────────────────────────────────────
const searchHospitals = asyncHandler(async (req, res) => {
  const { q = "" } = req.query;

  if (!q.trim()) {
    return getAllHospitals(req, res);
  }

  const regex = new RegExp(q.trim(), "i");

  // Find hospitals matching name or address
  const hospitalMatches = await Hospital.aggregate([
    {
      $match: {
        $or: [{ name: regex }, { address: regex }],
      },
    },
    {
      $lookup: {
        from: "departments",
        localField: "_id",
        foreignField: "hospital",
        as: "departments",
      },
    },
    {
      $addFields: {
        departmentCount: { $size: "$departments" },
        departmentNames: "$departments.name",
      },
    },
    { $project: { departments: 0 } },
  ]);

  // Also find hospitals that have a matching department
  const deptMatches = await Department.find({ name: regex }).populate("hospital");
  const deptHospitalIds = deptMatches
    .map((d) => d.hospital?._id?.toString())
    .filter(Boolean);

  // Merge, deduplicate by id
  const seen = new Set(hospitalMatches.map((h) => h._id.toString()));
  for (const dept of deptMatches) {
    if (dept.hospital && !seen.has(dept.hospital._id.toString())) {
      seen.add(dept.hospital._id.toString());
      hospitalMatches.push({
        ...dept.hospital.toObject(),
        departmentNames: [dept.name],
        departmentCount: 1,
      });
    }
  }

  return res.status(200).json(new ApiResponse(200, hospitalMatches, "Search results fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/departments — All departments (with hospital info)
// ─────────────────────────────────────────────────────────────────────────────
const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find()
    .populate("hospital", "name address")
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, departments, "Departments fetched successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/admin-stats — Admin dashboard aggregate stats
// Called by Admin Dashboard page
// REDIS CACHE POINT: cache for 30s with key "stats:admin"
// SOCKET.IO HOOK: emit "stats:updated" after any token mutation
// ─────────────────────────────────────────────────────────────────────────────
const getAdminDashboardStats = asyncHandler(async (req, res) => {
  const [
    hospitalsCount,
    departmentsCount,
    totalTokens,
    waitingNow,
    calledNow,
    completedToday,
    emergencyNow,
    doctorsCount,
  ] = await Promise.all([
    Hospital.countDocuments(),
    Department.countDocuments(),
    Token.countDocuments(),
    Token.countDocuments({ status: "WAITING" }),
    Token.countDocuments({ status: "CALLED" }),
    Token.countDocuments({
      status: "COMPLETED",
      completedAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    }),
    Token.countDocuments({ status: "WAITING", priority: "EMERGENCY" }),
    User.countDocuments({ role: "doctor" }),
  ]);

  // Simple avg wait time approximation (can be replaced with Redis/aggregation)
  const avgWaitTime = waitingNow > 0 ? Math.round(waitingNow * 5) : 0;

  const stats = {
    hospitalsCount,
    departmentsCount,
    totalTokens,
    waitingNow,
    calledNow,
    completedToday,
    emergencyNow,
    doctorsCount,
    avgWaitTime,
  };

  // ─── REDIS CACHE POINT ───────────────────────────────────────────────────────
  // await redis.setex("stats:admin", 30, JSON.stringify(stats));
  // ────────────────────────────────────────────────────────────────────────────

  return res.status(200).json(new ApiResponse(200, stats, "Admin stats fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/recent-activity — Last 15 token events for activity feed
// REDIS CACHE POINT: cache for 15s with key "activity:recent"
// ─────────────────────────────────────────────────────────────────────────────
const getRecentActivity = asyncHandler(async (req, res) => {
  const recentTokens = await Token.find({})
    .populate("patientId", "name")
    .populate("hospitalId", "name")
    .populate("departmentId", "name")
    .sort({ updatedAt: -1 })
    .limit(15)
    .lean();

  const activity = recentTokens.map((token) => {
    let action, type;
    switch (token.status) {
      case "WAITING":
        action = "New token booked";
        type = "token";
        break;
      case "CALLED":
        action = "Patient called";
        type = "called";
        break;
      case "COMPLETED":
        action = "Patient completed";
        type = "completed";
        break;
      case "SKIPPED":
        action = "Patient skipped";
        type = "skipped";
        break;
      case "CANCELLED":
        action = "Token cancelled";
        type = "cancelled";
        break;
      default:
        action = "Token updated";
        type = "update";
    }

    if (token.priority === "EMERGENCY") {
      action = "🚨 Emergency patient";
      type = "emergency";
    }

    return {
      id: token._id,
      action,
      type,
      detail: `#${token.tokenNumber} — ${token.departmentId?.name || "Dept"}, ${token.hospitalId?.name || "Hospital"}`,
      patientName: token.patientId?.name || "Patient",
      time: token.updatedAt,
    };
  });

  return res.status(200).json(new ApiResponse(200, activity, "Recent activity fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/system-stats — Global queue stats across all hospitals
// ─────────────────────────────────────────────────────────────────────────────
const getSystemStats = asyncHandler(async (req, res) => {
  const stats = await Token.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const result = { WAITING: 0, CALLED: 0, COMPLETED: 0, SKIPPED: 0, CANCELLED: 0 };
  stats.forEach((s) => {
    result[s._id] = s.count;
  });

  return res.status(200).json(new ApiResponse(200, result, "System stats fetched"));
});

module.exports = {
  getAllHospitals,
  searchHospitals,
  getAllDepartments,
  getAdminDashboardStats,
  getRecentActivity,
  getSystemStats,
};
