const { Worker } = require("bullmq");
const { redisConnection } = require("../config/bullmq");
// We reuse the SMS producer to dispatch the physical message
const { enqueueSms } = require("../jobs/sms.producer");

/**
 * ============================================================================
 * DELAYED REMINDER WORKER (CONSUMER)
 * ============================================================================
 * What this file does:
 * This worker picks up jobs when a patient is exactly 10 spots away in the queue.
 * Instead of containing complex API logic itself, it acts as a smart string-formatter,
 * builds the final message, and then delegates the delivery to the `sms-queue`.
 */

const handleReminderJob = async (job) => {
  const { phoneNumber, patientName, tokenNumber, patientsAhead } = job.data;

  if (!phoneNumber) {
    throw new Error("Missing phoneNumber for reminder");
  }

  // 1. Format the dynamic message
  const message = `Reminder: Hi ${patientName}, your turn (Token #${tokenNumber}) is approaching! There are only ${patientsAhead} patients ahead of you. Please head to the waiting area.`;

  console.log(`[Reminder Worker] Processing reminder for token #${tokenNumber}. Passing to SMS Queue.`);

  // 2. Delegate the actual sending to the SMS Queue
  // This is a beautiful microservice pattern: Workers pushing jobs to other workers.
  await enqueueSms({
    phoneNumber,
    message,
  });

  return { status: "reminder_dispatched" };
};

const reminderWorker = new Worker("reminder-queue", handleReminderJob, {
  connection: redisConnection,
  concurrency: 5,
});

reminderWorker.on("completed", (job) => {
  console.log(`[Reminder Worker] Job ${job.id} completed.`);
});

reminderWorker.on("failed", (job, err) => {
  console.error(`[Reminder Worker] Job ${job.id} failed: ${err.message}`);
});

module.exports = reminderWorker;
