const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const User = require("../models/User");

const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "default_access_secret");
    
    const user = await User.findById(decodedToken?._id).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});

const isAdmin = asyncHandler(async (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    throw new ApiError(403, "Access denied. Admin resources only.");
  }
});

const isReceptionist = asyncHandler(async (req, res, next) => {
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
