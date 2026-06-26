const mongoose = require("mongoose");

/**
 * QueueCounter — Atomic per-department token counter
 *
 * Uses MongoDB's findOneAndUpdate with $inc and upsert:true to
 * guarantee race-condition-free token number generation even under
 * high concurrent load. Drop-in Redis replacement is trivial:
 * swap findOneAndUpdate for INCR on the Redis key.
 */
const queueCounterSchema = new mongoose.Schema(
  {
    // Composite key: one counter per hospital+department combo
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    // The last issued token number for this queue
    currentToken: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Unique compound index — one counter doc per hospital+department
queueCounterSchema.index(
  { hospitalId: 1, departmentId: 1 },
  { unique: true }
);

/**
 * Atomically increments and returns the next token number.
 * This is the ONLY safe way to generate tokens under concurrency.
 */
queueCounterSchema.statics.getNextToken = async function (hospitalId, departmentId) {
  const counter = await this.findOneAndUpdate(
    { hospitalId, departmentId },
    { $inc: { currentToken: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  return counter.currentToken;
};

const QueueCounter = mongoose.model("QueueCounter", queueCounterSchema);
module.exports = QueueCounter;
