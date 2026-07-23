const { Queue } = require("bullmq");
const { defaultQueueOptions } = require("../config/bullmq");

/**
 * ============================================================================
 * DELAYED REMINDER PRODUCER
 * ============================================================================
 * What this file does:
 * Enqueues a job to remind a patient that their turn is coming up soon.
 * 
 * Data Flow:
 * - IN: Triggered by `QueueService.callNextToken()`. When the Receptionist clicks "Call Next", 
 *       the service checks MongoDB for the 10th patient in line using `.skip(9)`. If found,
 *       that patient's details are passed into this function.
 * - OUT: Saved to Redis. `reminder.worker.js` picks it up.
 */

const reminderQueue = new Queue("reminder-queue", defaultQueueOptions);

/**
 * Pushes a reminder job to notify a patient that their turn is approaching.
 * 
 * @param {Object} payload 
 * @param {string} payload.phoneNumber - Patient's phone number
 * @param {string} payload.patientName - Patient's name
 * @param {number} payload.tokenNumber - Their token number
 * @param {number} payload.patientsAhead - How many people are currently ahead of them
 */
const enqueueReminder = async (payload) => {
  // CRITICAL IDEMPOTENCY: 
  // We only ever want to send the "10 patients ahead" reminder ONCE per patient token.
  // If the receptionist clicks "Call Next" rapidly, the server might try to queue this multiple times.
  // By hardcoding the tokenNumber and "10_ahead" into the jobId, BullMQ will reject any
  // subsequent attempts to enqueue a reminder for this specific token.
  const jobId = `reminder_${payload.tokenNumber}_10_ahead`;

  await reminderQueue.add("send-reminder", payload, {
    jobId, 
  });

  console.log(`[Reminder Producer] Job enqueued: ${jobId}`);
};

module.exports = {
  reminderQueue,
  enqueueReminder,
};
