const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: [true, "Hospital reference is required"],
    },
    doctorSlots: {
      type: Number,
      default: 1,
    },
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
    crowd: {
      type: String,
      enum: ["low", "moderate", "high", "severe"],
      default: "low",
    },
    waitTime: {
      type: String,
      default: "—",
    },
  },
  { timestamps: true }
);

const Department = mongoose.model("Department", departmentSchema);
module.exports = Department;
