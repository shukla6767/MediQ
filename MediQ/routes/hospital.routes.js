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

/**
 * ============================================================================
 * HOSPITAL ROUTES
 * ============================================================================
 * What this file does:
 * Handles routing for fetching Hospital and Department data.
 * Notice how we mix Public routes (anyone can see a list of hospitals) with
 * Protected routes (only Admins can see dashboard stats).
 */

const router = Router();

// ── Public endpoints (no auth required) ─────────────────────────────────────
// Anyone on the internet can fetch this data.
router.route("/").get(getAllHospitals);
router.route("/search").get(searchHospitals);
router.route("/departments").get(getAllDepartments);

// ── Protected endpoints (auth required) ──────────────────────────────────────
// We inject the `verifyJWT` and `isAdmin` middlewares inline directly onto the route.
router.route("/admin-stats").get(verifyJWT, isAdmin, getAdminDashboardStats);
router.route("/recent-activity").get(verifyJWT, isAdmin, getRecentActivity);

// Any logged-in user can view system stats
router.route("/system-stats").get(verifyJWT, getSystemStats);

module.exports = router;
