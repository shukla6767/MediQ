const { Queue } = require("bullmq");
const { defaultQueueOptions } = require("../config/bullmq");

/**
 * ============================================================================
 * SMS PRODUCER (PUBLISHER)
 * ============================================================================
 * What this file does:
 * Creates the "sms-queue" and provides a function to push jobs into it.
 * It DOES NOT send the SMS itself. It just writes the task to Redis memory.
 * 
 * Data Flow:
 * 1. IN: Receives payload from `controllers/queue.controllers.js` (when a token is booked)
 *        or from `workers/reminder.worker.js` (when a reminder is triggered).
 * 2. ACTION: Packages the payload into a BullMQ Job object and saves it to Redis.
 * 3. OUT: The `smsWorker.js` constantly listens to this Redis queue and picks up the job.
 */

// Define the Queue. The name "sms-queue" MUST strictly match the name used in sms.worker.js
const smsQueue = new Queue("sms-queue", defaultQueueOptions);

/**
 * Pushes a new SMS job into the BullMQ queue.
 * 
 * @param {Object} payload 
 * @param {string} payload.phoneNumber - The recipient's phone number
 * @param {string} payload.message - The content of the SMS
 */
const enqueueSms = async (payload) => {
  // IDEMPOTENCY KEY: By combining the phone number and timestamp, we create a unique ID.
  // If the frontend lags and the user double-clicks "Book Token", the controller might
  // accidentally fire this function twice in 1 millisecond. BullMQ will see two jobs
  // with the exact same jobId and automatically ignore the second one, preventing duplicate texts.
  const jobId = `sms_${payload.phoneNumber}_${Date.now()}`;

  await smsQueue.add("send-sms", payload, {
    jobId, 
  });

  console.log(`[SMS Producer] Job enqueued: ${jobId}`);
};

module.exports = {
  smsQueue,
  enqueueSms,
};
