const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const { ApiError } = require("../utils/ApiError");
// We import the HospitalService where all the complex database logic is hidden
const HospitalService = require("../services/HospitalService");

/**
 * ============================================================================
 * HOSPITAL CONTROLLERS (READ-ONLY)
 * ============================================================================
 * What this file does:
 * Handles incoming HTTP GET requests for public hospital data and dashboards.
 * Notice how "thin" this file is! Because we moved the complex logic into 
 * `HospitalService.js`, the controller just acts as a simple traffic cop:
 * 1. Takes the request
 * 2. Asks the Service for data
 * 3. Sends the response
 */

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals — All hospitals with department count
// ─────────────────────────────────────────────────────────────────────────────
const getAllHospitals = asyncHandler(async (req, res) => {
  const hospitals = await HospitalService.getAllHospitals();

  return res.status(200).json(new ApiResponse(200, hospitals, "Hospitals fetched successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/search?q=keyword — Full-text search on hospitals
// ─────────────────────────────────────────────────────────────────────────────
const searchHospitals = asyncHandler(async (req, res) => {
  // Extract the search keyword `q` from the URL query string (e.g., ?q=Dental)
  const { q = "" } = req.query;
  const hospitalMatches = await HospitalService.searchHospitals(q);

  return res.status(200).json(new ApiResponse(200, hospitalMatches, "Search results fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/departments — All departments (with hospital info)
// ─────────────────────────────────────────────────────────────────────────────
const getAllDepartments = asyncHandler(async (req, res) => {
  const departments = await HospitalService.getAllDepartments();

  return res.status(200).json(new ApiResponse(200, departments, "Departments fetched successfully"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/admin-stats — Admin dashboard aggregate stats
// ─────────────────────────────────────────────────────────────────────────────
const getAdminDashboardStats = asyncHandler(async (req, res) => {
  // This service method handles all the Redis Caching for us!
  const stats = await HospitalService.getAdminDashboardStats();

  return res.status(200).json(new ApiResponse(200, stats, "Admin stats fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/recent-activity — Last 15 token events for activity feed
// ─────────────────────────────────────────────────────────────────────────────
const getRecentActivity = asyncHandler(async (req, res) => {
  const activity = await HospitalService.getRecentActivity();

  return res.status(200).json(new ApiResponse(200, activity, "Recent activity fetched"));
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/hospitals/system-stats — Global queue stats across all hospitals
// ─────────────────────────────────────────────────────────────────────────────
const getSystemStats = asyncHandler(async (req, res) => {
  const result = await HospitalService.getSystemStats();

  return res.status(200).json(new ApiResponse(200, result, "System stats fetched"));
});

module.exports = {
  getAllHospitals,
  searchHospitals,
  getAllDepartments,
  getAdminDashboardStats,
  getRecentActivity,
  getSystemStats,
};
