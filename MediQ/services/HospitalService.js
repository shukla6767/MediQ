const Hospital = require("../models/Hospital");
const Department = require("../models/Department");
const Token = require("../models/Token");
const User = require("../models/User");
const redisConnection = require("../config/redis");

/**
 * ============================================================================
 * HOSPITAL SERVICE
 * ============================================================================
 * What this file does:
 * Handles heavy data aggregation for the Hospital, Departments, and Dashboards.
 * 
 * Why a Service Layer?
 * By keeping this logic out of the `hospital.controllers.js`, we can easily call 
 * `HospitalService.getAdminDashboardStats()` from anywhere (e.g., a Cron Job, an internal tool)
 * without needing to fake an Express HTTP `req` and `res` object.
 */
class HospitalService {
  
  /**
   * Fetches all hospitals and dynamically counts how many departments they have.
   */
  async getAllHospitals() {
    // We use MongoDB Aggregation Framework for high performance.
    // Instead of fetching hospitals, then doing a slow `for` loop to fetch departments for each one,
    // this executes entirely inside the MongoDB C++ engine in a single pass.
    return Hospital.aggregate([
      {
        $lookup: {
          from: "departments", // The collection to join
          localField: "_id",
          foreignField: "hospital",
          as: "departments",
        },
      },
      {
        $addFields: {
          departmentCount: { $size: "$departments" },
          departmentNames: "$departments.name", // Extracts just the names into an array
        },
      },
      {
        $project: {
          departments: 0, // Removes the raw department objects to save bandwidth
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
  }

  /**
   * Searches hospitals by name or address.
   * If a user searches for a specific department (e.g., "Cardiology"), it will also
   * return the hospitals that contain that department!
   * 
   * @param {string} q - The search query string
   */
  async searchHospitals(q) {
    if (!q || !q.trim()) {
      return this.getAllHospitals();
    }

    const regex = new RegExp(q.trim(), "i");

    // 1. Search hospitals directly by name or address
    const hospitalMatches = await Hospital.aggregate([
      { $match: { $or: [{ name: regex }, { address: regex }] } },
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

    // 2. Search departments by name (e.g., user types "Dental")
    const deptMatches = await Department.find({ name: regex }).populate("hospital");
    
    // 3. Deduplicate the results using a Set
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

    return hospitalMatches;
  }

  async getAllDepartments() {
    return Department.find()
      .populate("hospital", "name address")
      .sort({ createdAt: -1 });
  }

  /**
   * Generates the massive statistics payload for the Admin Dashboard.
   * Because this runs 8 simultaneous database queries, it is heavily cached in Redis.
   */
  async getAdminDashboardStats() {
    const CACHE_KEY = "admin_dashboard_stats";

    // 1. Try to fetch from Redis Cache (RAM is 100x faster than MongoDB)
    const cachedStats = await redisConnection.get(CACHE_KEY);
    if (cachedStats) {
      console.log("[Cache HIT] Admin Dashboard Stats");
      return JSON.parse(cachedStats); // Convert string back to JSON
    }

    console.log("[Cache MISS] Fetching Admin Dashboard Stats from MongoDB");
    
    // 2. Fallback to MongoDB if not cached
    // We use Promise.all to run all 8 queries AT THE EXACT SAME TIME (Concurrently).
    // If we used `await` on each one sequentially, the dashboard would load 8x slower.
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
        completedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      }),
      Token.countDocuments({ status: "WAITING", priority: "EMERGENCY" }),
      User.countDocuments({ role: "doctor" }),
    ]);

    // Crude average wait time calculation (5 minutes per waiting patient)
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

    // 3. Store in Redis with a 60-second TTL (Time to Live)
    // Ensures admins get relatively fresh data, but protects DB from spam refresh
    await redisConnection.setex(CACHE_KEY, 60, JSON.stringify(stats));

    return stats;
  }

  /**
   * Fetches the 15 most recent activities (booking, calling, cancelling)
   * to display a live feed on the admin dashboard.
   */
  async getRecentActivity() {
    // `.lean()` strips all MongoDB model wrapper functions and returns raw JSON,
    // which makes the query significantly faster and uses less server memory.
    const recentTokens = await Token.find({})
      .populate("patientId", "name")
      .populate("hospitalId", "name")
      .populate("departmentId", "name")
      .sort({ updatedAt: -1 })
      .limit(15)
      .lean();

    // Map the raw database documents into user-friendly strings for the UI
    return recentTokens.map((token) => {
      let action, type;
      switch (token.status) {
        case "WAITING": action = "New token booked"; type = "token"; break;
        case "CALLED": action = "Patient called"; type = "called"; break;
        case "COMPLETED": action = "Patient completed"; type = "completed"; break;
        case "SKIPPED": action = "Patient skipped"; type = "skipped"; break;
        case "CANCELLED": action = "Token cancelled"; type = "cancelled"; break;
        default: action = "Token updated"; type = "update";
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
  }

  /**
   * Generates aggregate counts of every token status (WAITING vs CALLED vs SKIPPED)
   */
  async getSystemStats() {
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

    return result;
  }
}

module.exports = new HospitalService();
