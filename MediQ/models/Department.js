const mongoose = require("mongoose");

/**
 * ============================================================================
 * DEPARTMENT MODEL
 * ============================================================================
 * What this file does:
 * Represents a single department (e.g., "Cardiology") inside a specific Hospital.
 * 
 * Relational Mapping in NoSQL:
 * Mongoose uses the `ref` keyword to create relationships. A Department belongs 
 * to a `Hospital`. By using `populate("hospital")` in our controllers, Mongoose 
 * automatically fetches the Hospital details and merges them into the JSON response!
 */

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
    },
    // Foreign Key: Links this document to a specific Hospital
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "Hospital reference is required"],
    },
    // How many physical desks/doctors are available to call patients
    doctorSlots: {
      type: Number,
      default: 1,
    },
    // The metric used to calculate Estimated Wait Time (EWT) for patients
    avgConsultationTime: {
      type: Number,
      default: 5, // minutes per patient
    },
    activeDoctors: {
      type: Number,
      default: 0,
    },
    currentQueue: {
      type: Number,
      default: 0,
    },
    // UI Metadata: Used by the frontend to color-code the dashboard (Red, Yellow, Green)
    crowd: {
      type: String,
      enum: ["low", "moderate", "high", "severe"],
      default: "low",
    },
    waitTime: {
      type: String,
      default: "—",
    },
    // Allows admins to temporarily stop patients from booking tokens if it gets too crowded
    isPaused: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Department = mongoose.model("Department", departmentSchema);
module.exports = Department;
