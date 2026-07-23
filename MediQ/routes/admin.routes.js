const { Router } = require("express");
const { addHospital, updateHospital, deleteHospital, addDepartment, updateDepartment, deleteDepartment, registerStaff } = require("../controllers/admin.controllers");
const { verifyJWT, isAdmin } = require("../middlewares/auth.middleware");

/**
 * ============================================================================
 * ADMIN ROUTES
 * ============================================================================
 * What this file does:
 * Maps HTTP verbs (GET, POST, PATCH, DELETE) to specific Controller functions 
 * for Super Admin actions.
 * 
 * Security:
 * We use Express Route Middleware (`router.use`) to apply `verifyJWT` and `isAdmin`
 * to EVERY single route in this file. This means if a normal patient tries to 
 * POST to `/hospitals`, the middleware will block them with a 403 Forbidden 
 * before the request even reaches the controller!
 */

const router = Router();

// Protect all admin routes with JWT and Admin check
router.use(verifyJWT, isAdmin);

// ── Staff routes ─────────────────────────────────────────────────────────────
router.route("/staff/register").post(registerStaff);

// ── Hospital routes ──────────────────────────────────────────────────────────
router.route("/hospitals").post(addHospital);

// We can chain HTTP verbs on the same URL path to keep the code extremely DRY
router.route("/hospitals/:id")
  .patch(updateHospital)
  .delete(deleteHospital);

// ── Department routes ────────────────────────────────────────────────────────
router.route("/departments").post(addDepartment);
router.route("/departments/:id")
  .patch(updateDepartment)
  .delete(deleteDepartment);

module.exports = router;
