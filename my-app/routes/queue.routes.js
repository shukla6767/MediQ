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

const router = Router();

// All routes require authentication
router.use(verifyJWT);

// ── PATIENT ROUTES ────────────────────────────────────────────────────────────
router.route("/book").post(bookToken);
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
