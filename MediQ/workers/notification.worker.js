const { Worker } = require("bullmq");
const { redisConnection } = require("../config/bullmq");
const { enqueueSms } = require("../jobs/sms.producer");
const { enqueueWhatsapp } = require("../jobs/whatsapp.producer");

/**
 * ============================================================================
 * NOTIFICATION ORCHESTRATOR WORKER
 * ============================================================================
 * What this file does:
 * This worker acts as a "Router" or "Fan-Out Pattern". Instead of doing heavy work itself,
 * it inspects a generic alert and routes it to specific physical transport queues.
 * 
 * Why?
 * If you add "Email Notifications" tomorrow, you don't have to rewrite your Controllers.
 * The Controller still just says `enqueueNotification(message)`, and this file is the 
 * only place you update to route the message to the new Email worker.
 */
const handleNotificationJob = async (job) => {
  // `channels` defaults to both sms and whatsapp if not specified
  const { type, phoneNumber, message, channels = ["sms", "whatsapp"] } = job.data;

  if (!phoneNumber || !message) {
    throw new Error("Missing phoneNumber or message for notification");
  }

  console.log(`[Notification Worker] Orchestrating '${type}' notification to ${phoneNumber}`);

  const tasks = [];

  // FAN-OUT: Create an array of asynchronous jobs to push to the dedicated transport queues
  if (channels.includes("sms")) {
    tasks.push(enqueueSms({ phoneNumber, message }));
  }
  
  if (channels.includes("whatsapp")) {
    tasks.push(enqueueWhatsapp({ phoneNumber, message }));
  }

  // Execute all push operations concurrently. 
  // We are waiting for BullMQ to accept the jobs, NOT for Twilio to send them.
  await Promise.all(tasks);

  return { status: "success", channelsDispatched: channels };
};

const notificationWorker = new Worker("notification-queue", handleNotificationJob, {
  connection: redisConnection,
  concurrency: 5,
});

notificationWorker.on("completed", (job, returnvalue) => {
  console.log(`[Notification Worker] Job ${job.id} dispatched to channels: ${returnvalue.channelsDispatched}`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`[Notification Worker] Job failed: ${err.message}`);
});

module.exports = notificationWorker;
