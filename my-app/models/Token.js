const mongoose = require("mongoose");

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
      default: "NORMAL",
    },
    status: {
      type: String,
      enum: ["WAITING", "CALLED", "COMPLETED", "SKIPPED", "CANCELLED"],
      default: "WAITING",
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
  { timestamps: true }
);

// Compound indexes for fast queue lookups (Socket.io / Redis ready)
tokenSchema.index({ hospitalId: 1, departmentId: 1, status: 1 });
tokenSchema.index({ hospitalId: 1, departmentId: 1, tokenNumber: 1 });
// Ensures a patient cannot have two WAITING tokens in the same department
tokenSchema.index(
  { patientId: 1, departmentId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "WAITING" },
  }
);

const Token = mongoose.model("Token", tokenSchema);
module.exports = Token;
