const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const User = require("../models/User");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");
const { sendPasswordResetEmail } = require("../utils/email");

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

// Generate tokens function
const generateAccessTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    return { accessToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating the access token");
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if ([name, email, password].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Prevent public registration of staff
  if (role === "doctor" || role === "receptionist") {
    throw new ApiError(403, "Staff accounts must be created by an Admin");
  }

  const existedUser = await User.findOne({ email });

  if (existedUser) {
    throw new ApiError(409, "User with email already exists");
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role || "patient",
  });

  const createdUser = await User.findById(user._id).select("-password");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  const { accessToken } = await generateAccessTokens(user._id);

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken } = await generateAccessTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getMe = asyncHandler(async (req, res) => {
  // `req.user` is set by verifyJWT middleware
  return res.status(200).json(new ApiResponse(200, req.user, "Current user fetched"));
});

const googleLogin = asyncHandler(async (req, res) => {
  const { credential, role } = req.body;
  if (!credential) throw new ApiError(400, "Google credential required");

  // Verify token with Google
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { name, email } = payload;

  // Prevent public registration of staff
  if (role === "doctor" || role === "receptionist") {
    throw new ApiError(403, "Staff accounts must be created by an Admin");
  }

  // Check if user exists
  let user = await User.findOne({ email });

  // If not, register them automatically
  if (!user) {
    user = await User.create({
      name,
      email,
      password: "GOOGLE_AUTH_" + Math.random().toString(36).substring(7), // Dummy password since they login with Google
      role: role || "patient",
    });
  }

  // Generate tokens
  const { accessToken } = await generateAccessTokens(user._id);
  const loggedInUser = await User.findById(user._id).select("-password");

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
        },
        "User logged in successfully with Google"
      )
    );
});

// ─────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD — Step 1: Request reset link
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email: email.toLowerCase() });

  // SECURITY: Always return same message whether user exists or not
  // This prevents user enumeration attacks
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, {}, "If this email exists, a reset link has been sent")
    );
  }

  // Generate a raw token and store its hash in DB
  const rawToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Build reset URL
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${rawToken}`;

  try {
    await sendPasswordResetEmail(user.email, user.name, resetUrl);
    return res.status(200).json(
      new ApiResponse(200, {}, "Password reset link sent to your email")
    );
  } catch (emailError) {
    // If email fails, clear the token so user can try again
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "Failed to send reset email. Please try again.");
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD — Step 2: Submit new password
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────────────────────────────────
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  if (!password || !confirmPassword) {
    throw new ApiError(400, "Password and confirmation are required");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Passwords do not match");
  }

  if (password.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters");
  }

  // Hash the raw URL token to compare against DB hash
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  // Find user with valid, non-expired reset token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpiry: { $gt: Date.now() }, // must not be expired
  }).select("+resetPasswordToken +resetPasswordExpiry +password");

  if (!user) {
    throw new ApiError(400, "Reset token is invalid or has expired");
  }

  // Update password — pre-save hook will hash it
  user.password = password;
  // Invalidate the token immediately after use (single-use)
  user.resetPasswordToken = null;
  user.resetPasswordExpiry = null;
  await user.save();

  // Auto-login: generate a fresh access token
  const { accessToken } = await generateAccessTokens(user._id);
  const updatedUser = await User.findById(user._id).select("-password");

  const options = { httpOnly: true, secure: process.env.NODE_ENV === "production" };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, { user: updatedUser, accessToken }, "Password reset successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE PROFILE — Edit name, phone
// PATCH /api/auth/me/update
// ─────────────────────────────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  const userId = req.user._id;

  if (!name?.trim()) {
    throw new ApiError(400, "Name is required");
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: { name: name.trim(), phone: phone?.trim() || null } },
    { new: true, runValidators: true }
  ).select("-password");

  if (!updatedUser) throw new ApiError(404, "User not found");

  return res.status(200).json(
    new ApiResponse(200, updatedUser, "Profile updated successfully")
  );
});

// ─────────────────────────────────────────────────────────────────────────────
// CHANGE PASSWORD — While logged in
// PATCH /api/auth/me/change-password
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  const userId = req.user._id;

  if (!currentPassword || !newPassword || !confirmNewPassword) {
    throw new ApiError(400, "All password fields are required");
  }

  if (newPassword !== confirmNewPassword) {
    throw new ApiError(400, "New passwords do not match");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters");
  }

  const user = await User.findById(userId).select("+password");
  if (!user) throw new ApiError(404, "User not found");

  const isCurrentValid = await user.isPasswordCorrect(currentPassword);
  if (!isCurrentValid) {
    throw new ApiError(401, "Current password is incorrect");
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json(
    new ApiResponse(200, {}, "Password changed successfully")
  );
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  googleLogin,
  forgotPassword,
  resetPassword,
  updateProfile,
  changePassword,
};
