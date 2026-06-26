const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

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
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "receptionist", "admin"],
      default: "patient",
    },
    phone: {
      type: String,
      default: null,
    },
    // Password reset fields — separate from login JWT
    resetPasswordToken: {
      type: String,
      default: null,
      select: false, // never returned in queries
    },
    resetPasswordExpiry: {
      type: Date,
      default: null,
      select: false,
    },
  },
  { timestamps: true }
);

// Encrypt password before saving
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// Compare password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate Access Token
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      role: this.role,
    },
    process.env.ACCESS_TOKEN_SECRET || "default_access_secret",
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    }
  );
};

/**
 * Generates a secure, single-use password reset token.
 * Returns the RAW token (sent to user via email).
 * Stores the SHA-256 HASH in the DB (never store raw tokens in DB).
 * Token expires in 15 minutes.
 */
userSchema.methods.generatePasswordResetToken = function () {
  // Generate cryptographically secure random token
  const rawToken = crypto.randomBytes(32).toString("hex");

  // Hash it before storing — if DB is compromised, raw token is useless
  this.resetPasswordToken = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  // 15-minute expiry
  this.resetPasswordExpiry = Date.now() + 15 * 60 * 1000;

  return rawToken; // This is what goes in the email link
};

const User = mongoose.model("User", userSchema);
module.exports = User;