const { Router } = require("express");
const {
  getAllHospitals,
  searchHospitals,
  getAllDepartments,
  getAdminDashboardStats,
  getRecentActivity,
  getSystemStats,
} = require("../controllers/hospital.controllers");
const { verifyJWT, isAdmin } = require("../middlewares/auth.middleware");

const router = Router();

// ── Public endpoints (no auth required) ─────────────────────────────────────
router.route("/").get(getAllHospitals);
router.route("/search").get(searchHospitals);
router.route("/departments").get(getAllDepartments);

// ── Protected endpoints (auth required) ──────────────────────────────────────
router.route("/admin-stats").get(verifyJWT, isAdmin, getAdminDashboardStats);
router.route("/recent-activity").get(verifyJWT, isAdmin, getRecentActivity);
router.route("/system-stats").get(verifyJWT, getSystemStats);

module.exports = router;
