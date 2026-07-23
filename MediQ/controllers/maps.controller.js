const mapsService = require("../services/maps.service");
const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");

/**
 * ============================================================================
 * MAPS CONTROLLER
 * ============================================================================
 * Handles incoming HTTP requests for Google Maps integrations.
 * We use a backend proxy to securely fetch data without exposing keys.
 */

const search = asyncHandler(async (req, res) => {
  const { query } = req.query;

  // Validation: Ensure the query exists before hitting the Google API
  if (!query || query.trim() === "") {
    throw new ApiError(400, "Search query is required");
  }

  // Fetch results from our newly fixed service layer
  const results = await mapsService.searchHospitals(query);

  // Return consistent ApiResponse format used by the rest of the project
  return res.status(200).json(
    new ApiResponse(200, results, "Hospital suggestions fetched successfully")
  );
});

module.exports = {
  search,
};