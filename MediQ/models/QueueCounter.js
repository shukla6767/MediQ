const mongoose = require("mongoose");

/**
 * ============================================================================
 * QUEUE COUNTER MODEL
 * ============================================================================
 * What this file does:
 * An isolated counter specifically built for safely generating the next `tokenNumber`
 * without race conditions.
 * 
 * Why it is necessary:
 * If we used `Token.countDocuments() + 1` to generate token numbers, two patients
 * clicking "Book" at the exact same millisecond would BOTH receive Token #12. 
 * By using MongoDB's atomic `$inc` on this isolated model, MongoDB locks the 
 * document natively, guaranteeing one gets #12 and the other gets #13.
 */
const queueCounterSchema = new mongoose.Schema(
  {
    // Composite key: one unique counter per hospital+department combo
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

// Unique compound index strictly enforces that only one counter exists per department
queueCounterSchema.index(
  { hospitalId: 1, departmentId: 1 },
  { unique: true }
);

/**
 * Atomically increments and returns the next token number.
 * `upsert: true` means if this is the very first patient to book a token in this 
 * department, MongoDB will seamlessly create the counter starting at 1.
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
