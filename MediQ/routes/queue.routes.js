const { Router } = require("express");
const {
  bookToken,
  getPatientTokenStatus,
  getMyTokens,
  cancelToken,
  getQueueByDepartment,
  callNext,
  completeToken,
  skipToken,
  recallToken,
  getQueueStats,
  getDoctorQueue,
} = require("../controllers/queue.controllers");
const { verifyJWT, isReceptionist, isPatient } = require("../middlewares/auth.middleware");
const { rateLimiter } = require("../middlewares/rateLimiter");

/**
 * ============================================================================
 * QUEUE ROUTES
 * ============================================================================
 * What this file does:
 * The backbone API endpoints for the entire hospital queueing system.
 * 
 * Rate Limiting Note:
 * Look at the `/book` route. We injected `rateLimiter(3, 900, "book_token")`.
 * This protects your database by limiting every user account to only 3 bookings
 * every 900 seconds (15 minutes).
 */

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// ── PATIENT ROUTES ────────────────────────────────────────────────────────────
// Rate limit: Max 3 tokens booked per 15 minutes per user to prevent spam
router.route("/book").post(rateLimiter(3, 900, "book_token"), bookToken);
router.route("/status").get(getPatientTokenStatus);
router.route("/my-tokens").get(getMyTokens);
router.route("/token/:id/cancel").patch(cancelToken);

// ── RECEPTION / ADMIN / DOCTOR ROUTES ─────────────────────────────────────────
router.route("/department").get(getQueueByDepartment);
router.route("/doctor-queue").get(getDoctorQueue);
router.route("/call-next").post(callNext);
router.route("/token/:id/complete").patch(completeToken);
router.route("/token/:id/skip").patch(skipToken);
router.route("/recall").post(recallToken);
router.route("/stats").get(getQueueStats);

module.exports = router;
