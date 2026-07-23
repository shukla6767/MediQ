const { Queue } = require("bullmq");
const { defaultQueueOptions } = require("../config/bullmq");

/**
 * ============================================================================
 * NOTIFICATION ORCHESTRATOR PRODUCER
 * ============================================================================
 * What this file does:
 * Acts as a generic entry point for system-wide alerts. Instead of controllers
 * importing 5 different queues, they just import this one.
 * 
 * Data Flow:
 * - IN: Receives abstract events (e.g., `type: 'department_closed'`) from anywhere in the app.
 * - OUT: Pushes to `notification-queue` in Redis, where the `notification.worker.js` acts
 *        as a router to distribute the message to SMS/WhatsApp.
 */

const notificationQueue = new Queue("notification-queue", defaultQueueOptions);

/**
 * Orchestrates notifications to multiple channels (SMS, WhatsApp).
 * 
 * @param {Object} payload 
 * @param {string} payload.type - Type of event (e.g., 'department_closed', 'emergency_inserted')
 * @param {string} payload.phoneNumber - Target phone number
 * @param {string} payload.message - The message to broadcast
 */
const enqueueNotification = async (payload) => {
  // Prevent duplicate broadcasts of the exact same event type to the exact same phone
  const jobId = `notif_${payload.type}_${payload.phoneNumber}_${Date.now()}`;

  await notificationQueue.add("broadcast-notification", payload, { jobId });
  console.log(`[Notification Producer] Orchestration job enqueued: ${jobId}`);
};

module.exports = {
  notificationQueue,
  enqueueNotification,
};
