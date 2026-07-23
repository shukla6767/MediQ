const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const User = require("../models/User");

/**
 * ============================================================================
 * AUTHENTICATION MIDDLEWARES
 * ============================================================================
 * What this file does:
 * These functions sit between the HTTP Router and the Controller. 
 * They act as bouncers at a club. If you don't have the right credentials (JWT),
 * or the right Role (Admin/Doctor), you are thrown out before ever executing business logic.
 */

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. verifyJWT (The Universal Check)
 * ─────────────────────────────────────────────────────────────────────────────
 * Decodes the JWT from the incoming request (Cookies or Headers), verifies the 
 * cryptographical signature using the secret key, and attaches `req.user` to the request.
 */
const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    // Allows token to be sent in an HTTP-Only cookie OR in the standard Authorization Header
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    // This will throw an error immediately if the token has expired or was forged
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default_access_secret");
    
    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // Attach user payload directly to the Express `req` object for the controllers to use
    req.user = user;
    
    // Express function telling the router to proceed to the next step
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. ROLE-BASED ACCESS CONTROL (RBAC)
 * ─────────────────────────────────────────────────────────────────────────────
 * These middlewares MUST be placed AFTER `verifyJWT`, because they rely on 
 * `req.user.role` which is injected by `verifyJWT`.
 */

const isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next(); // Pass! Let them in.
  } else {
    throw new ApiError(403, "Access denied. Admin resources only."); // Blocked.
  }
});

const isReceptionist = asyncHandler(async (req, res, next) => {
  // Admins are intrinsically allowed to do anything a receptionist can do
  if (req.user && ["receptionist", "admin"].includes(req.user.role)) {
    next();
  } else {
    throw new ApiError(403, "Access denied. Reception resources only.");
  }
});

const isPatient = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "patient") {
    next();
  } else {
    throw new ApiError(403, "Access denied. Patient resources only.");
  }
});

module.exports = { verifyJWT, isAdmin, isReceptionist, isPatient };
