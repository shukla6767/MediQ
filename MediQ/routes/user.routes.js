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
  refreshAccessToken,
} = require("../controllers/user.controllers");
const { verifyJWT } = require("../middlewares/auth.middleware");

/**
 * ============================================================================
 * USER ROUTES (AUTH)
 * ============================================================================
 * What this file does:
 * Exposes the standard JWT Authentication endpoints (Login, Register, SSO).
 * 
 * Security Note:
 * Notice that `/refresh` is a public route, but `/me` is protected.
 * This is how modern JWT session management works. The frontend asks `/refresh`
 * for a new token, and then uses that token to access `/me`.
 */

const router = Router();

// ── Public routes ─────────────────────────────────────────────────────────────
router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/google").post(googleLogin);
router.route("/refresh").post(refreshAccessToken);

// Password reset flow (no auth required — user is not logged in yet)
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password/:token").post(resetPassword);

// ── Protected routes ──────────────────────────────────────────────────────────
// Only users with valid JWTs can access these
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getMe);
router.route("/me/update").patch(verifyJWT, updateProfile);
router.route("/me/change-password").patch(verifyJWT, changePassword);

module.exports = router;
