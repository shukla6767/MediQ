const { Router } = require("express");
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  googleLogin,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
} = require("../controllers/user.controllers");
const { verifyJWT } = require("../middlewares/auth.middleware");

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/google").post(googleLogin);

// Password reset flow (no auth required — user is not logged in yet)
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);

// ── Protected routes ──────────────────────────────────────────────────────────
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getMe);
router.route("/me/update").patch(verifyJWT, updateProfile);
router.route("/me/change-password").patch(verifyJWT, changePassword);

module.exports = router;
