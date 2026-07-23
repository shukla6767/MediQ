const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

/**
 * ============================================================================
 * USER MODEL
 * ============================================================================
 * What this file does:
 * Defines the Patient, Doctor, Receptionist, and Admin schema.
 * 
 * "Fat Models, Thin Controllers":
 * Notice how we place the `generateAccessToken`, `generateRefreshToken`, and 
 * `isPasswordCorrect` logic directly INSIDE this file. By tying the behavior 
 * directly to the data schema, we keep our controllers extremely clean.
 */

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true, // MongoDB automatically creates an index and enforces uniqueness
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      // SECURITY: `select: false` means that if a developer accidentally types `User.find()`, 
      // Mongoose will completely omit the password hash from the result to prevent data leaks.
      select: false, 
    },
    role: {
      type: String,
      // Role-Based Access Control (RBAC) definitions
      enum: ["patient", "doctor", "receptionist", "admin"],
      default: "patient", // The safest possible default
    },
    phone: {
      type: String,
      default: null,
    },
    // Used for the "Forgot Password" email flow
    resetPasswordToken: {
      type: String,
      default: null,
      select: false, 
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    refreshToken: {
      type: String,
      select: false,
    }
  },
  { timestamps: true }
);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MONGOOSE MIDDLEWARE (Hooks)
 * ─────────────────────────────────────────────────────────────────────────────
 * This code runs AUTOMATICALLY every time `user.save()` is called. 
 * We intercept the save to Hash the password if it was modified.
 */
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  // Cost factor of 10: High enough to prevent brute force, low enough to not stall the CPU.
  this.password = await bcrypt.hash(this.password, 10);
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * INSTANCE METHODS
 * ─────────────────────────────────────────────────────────────────────────────
 */

// Cryptographically verifies if the plaintext password matches the stored bcrypt hash
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generates a short-lived (15m - 1d) Access JWT for API requests
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, role: this.role },
    process.env.ACCESS_TOKEN_SECRET || "default_access_secret",
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d" }
  );
};

// Generates a long-lived (7d) Refresh JWT used purely to get new Access Tokens
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { _id: this._id },
    process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret",
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || "7d" }
  );
};

/**
 * Generates a secure, single-use password reset token.
 * Returns the RAW token (which gets emailed to the user as a clickable link).
 * Stores the SHA-256 HASH in the DB. If the DB is compromised, hackers only get hashes, not raw links!
 */
userSchema.methods.generatePasswordResetToken = function () {
  const rawToken = crypto.randomBytes(32).toString("hex");

  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  this.resetPasswordExpiry = Date.now() + 15 * 60 * 1000; // Expires strictly in 15 mins

  return rawToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;