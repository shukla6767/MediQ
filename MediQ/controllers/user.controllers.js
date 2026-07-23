const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const User = require("../models/User");
const UserService = require("../services/UserService");
const jwt = require("jsonwebtoken");

/**
 * ============================================================================
 * USER CONTROLLERS
 * ============================================================================
 * What this file does:
 * Handles Authentication HTTP routes. 
 * Because actual cryptography (passwords, JWTs) is complex, this controller
 * delegates all the heavy lifting to `UserService.js`.
 */

// We configure HTTP-Only cookies so hackers cannot steal tokens using XSS (JavaScript)
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // Only require HTTPS in production
};

// Refresh tokens last for 7 days
const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000, 
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Delegate business logic to Service layer
  const { user, accessToken, refreshToken } = await UserService.register(name, email, password, role);

  // Send the tokens back as secure cookies AND in the JSON response
  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(new ApiResponse(201, user, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, accessToken, refreshToken } = await UserService.login(email, password);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user,
          accessToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  if (req.user) {
    // Erase the refresh token from the database so it can never be used again
    await User.findByIdAndUpdate(req.user._id, {
      $unset: { refreshToken: 1 }
    });
  }

  // Clear the cookies from the user's browser
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getMe = asyncHandler(async (req, res) => {
  // `req.user` is automatically attached to the request by the `verifyJWT` middleware
  // before this function ever runs.
  return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));
});

const googleLogin = asyncHandler(async (req, res) => {
  const { credential, role } = req.body;
  const { user, accessToken, refreshToken } = await UserService.googleLogin(credential, role);

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, refreshCookieOptions)
    .json(
      new ApiResponse(
        200,
        { user, accessToken },
        "Google login successful"
      )
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — Step 1: Request reset link
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });

  // SECURITY: Always return the exact same success message whether the user exists or not.
  // If we returned "User not found", hackers could script it to find out which emails are registered.
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, {}, "If this email exists, a reset link has been sent")
    );
  }

  // Generate a raw, unhashed token to email to the user
  const rawToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
    return res.status(200).json(
      new ApiResponse(200, {}, "Password reset link sent to your email")
    );
  } catch (emailError) {
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send reset email. Please try again.");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD — Step 2: Submit new password
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new ApiError(400, "Token and new password are required");
  }

  // Re-hash the token they sent us and compare it to the hash in the database
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() }, // Ensure the 15-minute timer hasn't expired
  });

  if (!user) {
    throw new ApiError(400, "Token is invalid or has expired");
  }

  user.password = newPassword; // Mongoose will automatically hash this new password before saving
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  return res.status(200).json(new ApiResponse(200, null, "Password reset successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// TOKEN REFRESH — Auto-login mechanism
// ─────────────────────────────────────────────────────────────────────────────
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret"
    );

    const user = await User.findById(decodedToken?._id).select("+refreshToken");

    if (!user || incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await UserService.generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, refreshCookieOptions)
      .json(
        new ApiResponse(200, { accessToken, refreshToken }, "Access token refreshed")
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { $set: { name, phone } },
    { new: true, runValidators: true }
  ).select("-password");
  return res.status(200).json(new ApiResponse(200, user, "Profile updated"));
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old and new password are required");
  }

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"));
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  googleLogin,
  forgotPassword,
  resetPassword,
  refreshAccessToken,
  updateProfile,
  changePassword,
};
