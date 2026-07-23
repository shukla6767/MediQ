const mongoose = require("mongoose");

/**
 * ============================================================================
 * TOKEN MODEL
 * ============================================================================
 * What this file does:
 * Defines the MongoDB schema for a Queue Token. This is the central entity 
 * of the entire application. It tracks a patient's journey from WAITING to COMPLETED.
 */

const tokenSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Patient is required"],
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "Hospital is required"],
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: [true, "Department is required"],
    },
    tokenNumber: {
      type: Number,
      required: true,
    },
    priority: {
      type: String,
      enum: ["NORMAL", "EMERGENCY"],
      default: "NORMAL", // Emergency tokens are sorted first in the QueueService
    },
    status: {
      type: String,
      enum: ["WAITING", "CALLED", "COMPLETED", "SKIPPED", "CANCELLED"],
      default: "WAITING", // State machine: WAITING -> CALLED -> COMPLETED
    },
    estimatedWait: {
      type: Number, // in minutes
      default: 0,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MONGODB INDEXES (Performance Optimization)
 * ─────────────────────────────────────────────────────────────────────────────
 * Without indexes, MongoDB has to scan every single token in the database to find 
 * who is WAITING in Cardiology. By creating Compound Indexes, the database maintains 
 * an internal B-Tree, allowing read times to drop from O(N) down to O(log N).
 */

// 1. Speeds up `getQueueByDepartment` API
tokenSchema.index({ hospitalId: 1, departmentId: 1, status: 1 });

// 2. Speeds up token number lookups
tokenSchema.index({ hospitalId: 1, departmentId: 1, tokenNumber: 1 });

// 3. Application Security: Prevents duplicate bookings
// A patient cannot hold two WAITING tokens in the exact same department simultaneously.
// The `partialFilterExpression` ensures this rule ONLY applies if the status is WAITING.
// If they have a COMPLETED token from yesterday, they CAN book a new WAITING token today!
tokenSchema.index(
  { patientId: 1, departmentId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "WAITING" },
  }
);

const Token = mongoose.model("Token", tokenSchema);
module.exports = Token;
