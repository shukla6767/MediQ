/**
 * ============================================================================
 * WORKERS ENTRY POINT (INITIALIZATION)
 * ============================================================================
 * What this file does:
 * It pulls all the individual BullMQ worker threads together into one place. 
 * When `server.js` starts up, it requires this file, which boots up all the
 * background consumers and starts the cron schedules.
 * 
 * Production Scaling Note:
 * In a monolithic app (like this one currently), these workers run in the same
 * Node.js CPU process as the Express web server. In a massive enterprise app
 * (e.g., millions of users), you would remove this file from `server.js` and run
 * it on a completely different server just by running `node workers/index.js`.
 */

// 1. Initialize environment variables immediately so the API keys (like Twilio)
// are injected into `process.env` before the workers boot up.
require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });

// 2. Import all the individual consumers (This turns them "ON" so they start listening to Redis)
const smsWorker = require("./sms.worker");
const whatsappWorker = require("./whatsapp.worker");
const reminderWorker = require("./reminder.worker");
const analyticsWorker = require("./analytics.worker");
const crowdWorker = require("./crowd.worker");
const cleanupWorker = require("./cleanup.worker");
const doctorWorker = require("./doctor.worker");
const notificationWorker = require("./notification.worker");

// 3. Import and execute the Cron Scheduler
const { startCronJobs } = require("../jobs/scheduler");

// Execute the schedulers. We catch any Redis connection errors so they don't crash the app.
startCronJobs().catch((err) => {
  console.error("[Scheduler Error] Failed to start cron jobs:", err);
});

console.log("[Workers] All BullMQ workers initialized and listening.");

// Export them just in case another part of the system needs to gracefully shut them down later.
module.exports = {
  smsWorker,
  whatsappWorker,
  reminderWorker,
  analyticsWorker,
  crowdWorker,
  cleanupWorker,
  doctorWorker,
  notificationWorker,
};
