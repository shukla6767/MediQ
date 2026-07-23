const { Client } = require("@googlemaps/google-maps-services-js");

// Initialize the Google Maps Node.js Client
const client = new Client({});

/**
 * ============================================================================
 * MAPS SERVICE
 * ============================================================================
 * Handles server-side communication with Google Maps APIs.
 * We use this to securely proxy requests through our backend.
 */

const searchHospitals = async (query) => {
  try {
    const response = await client.placeAutocomplete({
      params: {
        input: query,
        // Fallback to NEXT_PUBLIC... if GOOGLE_MAPS_SERVER_KEY isn't set in .env yet
        key: process.env.GOOGLE_MAPS_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
        // Ensure consistency with the frontend by restricting searches to medical places
        types: ["hospital", "health", "clinic"],
      },
    });

    // Map over the predictions to return a clean, consistent array to the controller
    return response.data.predictions.map((place) => ({
      placeId: place.place_id,
      description: place.description,
    }));
  } catch (error) {
    // Log the actual Google Maps error for debugging
    console.error("Google Maps API Error:", error.response?.data?.error_message || error.message);
    throw new Error("Failed to fetch hospital suggestions from Google Maps");
  }
};

module.exports = {
  searchHospitals,
};