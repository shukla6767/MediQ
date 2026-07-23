const mongoose = require("mongoose");

/**
 * ============================================================================
 * HOSPITAL MODEL
 * ============================================================================
 * What this file does:
 * Represents the top-level Hospital entity. 
 * 
 * Schema Design:
 * Notice that we DO NOT store an array of `departments: []` inside the Hospital.
 * That is an anti-pattern in MongoDB called "Unbounded Arrays" which can crash 
 * the database if a hospital adds too many departments.
 * Instead, the `Department` model holds a reference to the `Hospital` (Parent Referencing).
 */

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Hospital name is required"],
      trim: true, // Automatically removes accidental trailing spaces
    },
    address: {
      type: String,
      required: [true, "Address is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
    },
    totalBeds: {
      type: Number,
      default: 0,
    },
    availableBeds: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
    },
    // Dynamic metadata calculated by Background Workers (crowd.worker.js)
    crowd: {
      type: String,
      enum: ["low", "moderate", "high", "severe"],
      default: "low",
    },
    waitTime: {
      type: String,
      default: "—",
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },

      coordinates: {
        type: [Number],
        required: true
      }
    },
    googlePlaceId: {
      type: String
    },
    formattedAddress: {
      type: String
    }
  },
  { timestamps: true }
);

hospitalSchema.index({
  location: "2dsphere",
});

const Hospital = mongoose.model("Hospital", hospitalSchema);
module.exports = Hospital;
