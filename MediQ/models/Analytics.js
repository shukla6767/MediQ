const mongoose = require("mongoose");

/**
 * ============================================================================
 * ANALYTICS MODEL
 * ============================================================================
 * What this file does:
 * Stores aggregated historical data for dashboards and reporting.
 * 
 * Performance Design:
 * Instead of calculating "Total Patients Served Today" by running a heavy `.countDocuments()`
 * across millions of Token records every time the dashboard loads, we run a background Worker 
 * (Analytics Worker) that computes these stats once and saves them into this lightweight schema.
 */

const analyticsSchema = new mongoose.Schema(
  {
    // The specific day these stats apply to
    date: {
      type: Date,
      required: true,
      unique: true, // Only one record per day
      // Setter: Strips the hours/minutes/seconds out. Keeps only YYYY-MM-DD.
      // This guarantees that "2024-05-15T12:00:00" and "2024-05-15T14:30:00"
      // both map to the exact same unique record.
      set: (val) => new Date(val.setHours(0, 0, 0, 0)),
    },
    totalPatientsServed: {
      type: Number,
      default: 0,
    },
    averageWaitTimeMinutes: {
      type: Number,
      default: 0,
    },
    peakHour: {
      type: Number, // 0-23 representing the busiest hour of the day
      default: null,
    },
    // Sub-document array: Breaks down the stats by specific departments
    departmentStats: [
      {
        departmentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Department",
        },
        patientsServed: Number,
        averageWaitTime: Number,
      },
    ],
  },
  { timestamps: true } // Adds createdAt (when record was created) and updatedAt (last modified)
);

module.exports = mongoose.model("Analytics", analyticsSchema);
