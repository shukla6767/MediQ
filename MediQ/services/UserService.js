const User = require("../models/User");
const { ApiError } = require("../utils/ApiError");
const { OAuth2Client } = require("google-auth-library");
const crypto = require("crypto");

/**
 * ============================================================================
 * USER SERVICE (AUTHENTICATION ENGINE)
 * ============================================================================
 * What this file does:
 * Handles everything related to security: Logging in, Registering, and Google SSO.
 * 
 * Why a Service Layer?
 * Security logic is usually the most complex part of a backend. By keeping it
 * completely isolated in this Service file, the `user.controllers.js` remains 
 * incredibly thin and easy to read.
 */

// Initialize Google SSO Client
const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

class UserService {
  /**
   * Internal Helper: Generates stateless Access and Refresh JWT tokens.
   * 
   * @param {string} userId - The MongoDB Object ID of the user
   */
  async generateAccessAndRefreshTokens(userId) {
    try {
      const user = await User.findById(userId);
      
      // We delegate the actual JWT cryptographic signing to methods defined directly 
      // on the Mongoose User model (see `models/User.js`).
      const accessToken = user.generateAccessToken();
      const refreshToken = user.generateRefreshToken();

      // Store the refresh token in the database so we can revoke it later if the user gets hacked
      user.refreshToken = refreshToken;
      await user.save({ validateBeforeSave: false });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new ApiError(500, "Something went wrong while generating tokens");
    }
  }

  /**
   * Standard Email/Password Registration
   */
  async register(name, email, password, role) {
    // 1. Basic Validation
    if ([name, email, password].some((field) => field?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    // 2. Security Check: Prevent privilege escalation
    // A random hacker on the internet cannot register as an admin or doctor.
    if (role === "doctor" || role === "receptionist") {
      throw new ApiError(403, "Staff accounts must be created by an Admin");
    }

    // 3. Uniqueness Check
    const existedUser = await User.findOne({ email });
    if (existedUser) {
      throw new ApiError(409, "User with email already exists");
    }

    // 4. Create the User (Mongoose hooks will automatically hash the password!)
    const user = await User.create({
      name,
      email,
      password,
      role: role || "patient", // Default to lowest privilege
    });

    // 5. Fetch the created user, explicitly stripping out the password hash so we don't leak it
    const createdUser = await User.findById(user._id).select("-password");
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering the user");
    }

    // 6. Generate Tokens
    const tokens = await this.generateAccessAndRefreshTokens(user._id);
    return { user: createdUser, ...tokens };
  }

  /**
   * Standard Email/Password Login
   */
  async login(email, password) {
    if (!email || !password) {
      throw new ApiError(400, "Email and password are required");
    }

    // 1. Fetch user. We MUST explicitly `.select("+password")` because our Mongoose Schema
    // hides passwords by default to prevent accidental data leaks.
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      throw new ApiError(404, "User does not exist");
    }

    // 2. Verify cryptography (Delegated to Mongoose model)
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid user credentials");
    }

    // 3. Generate session tokens
    const tokens = await this.generateAccessAndRefreshTokens(user._id);
    
    // 4. Strip the password again before returning to the Controller
    const loggedInUser = await User.findById(user._id).select("-password");

    return { user: loggedInUser, ...tokens };
  }

  /**
   * Google Single Sign-On (SSO) Login
   * 
   * How it works:
   * 1. The React frontend opens a Google popup.
   * 2. Google gives the frontend a cryptographic `credential` token.
   * 3. The frontend sends that token here.
   * 4. We verify the token cryptographically with Google's servers.
   */
  async googleLogin(credential, role) {
    if (!credential) throw new ApiError(400, "Google credential required");

    // 1. Cryptographic Verification
    // We send the token back to Google to prove it wasn't forged by a hacker.
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    // Google confirmed it's real! We can trust this email.
    const payload = ticket.getPayload();
    const { name, email } = payload;

    // Security Check
    if (role === "doctor" || role === "receptionist") {
      throw new ApiError(403, "Staff accounts must be created by an Admin");
    }

    // 2. Lookup existing user
    let user = await User.findOne({ email });

    // 3. Auto-Registration
    // If this is their first time logging in with Google, we silently create an account for them.
    if (!user) {
      user = await User.create({
        name,
        email,
        // They will never type a password because they use Google SSO, 
        // but our database strictly requires one, so we generate a cryptographically random one.
        password: crypto.randomBytes(16).toString("hex"),
        role: role || "patient",
      });
    }

    // 4. Grant access
    const tokens = await this.generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password");

    return { user: loggedInUser, ...tokens };
  }
}

module.exports = new UserService();
