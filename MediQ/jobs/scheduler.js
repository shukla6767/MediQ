const { Queue } = require("bullmq");
const { defaultQueueOptions } = require("../config/bullmq");

/**
 * ============================================================================
 * CRON SCHEDULER (AUTOMATED REPEATABLE JOBS)
 * ============================================================================
 * What this file does:
 * Instead of waiting for a user to click a button, this file defines jobs that
 * run on a strict, time-based schedule (like a clock). 
 * 
 * Data Flow:
 * - OUT: Pushes job configurations into Redis. BullMQ automatically reads the 
 *        `cron` string and holds the job in a "Delayed" state until the exact minute arrives.
 */

const analyticsQueue = new Queue("analytics-queue", defaultQueueOptions);
const crowdQueue = new Queue("crowd-queue", defaultQueueOptions);
const cleanupQueue = new Queue("cleanup-queue", defaultQueueOptions);

/**
 * Initializes the repeatable Cron jobs.
 * This should be called exactly once when the worker process boots up (`workers/index.js`).
 */
const startCronJobs = async () => {
  // Feature 4: Night Analytics Worker
  // Runs every day at 00:01 (1 minute past midnight) to calculate yesterday's stats
  await analyticsQueue.add("nightly-analytics", {}, {
    repeat: {
      cron: "1 0 * * *", // Standard Unix Cron Format: Minute 1, Hour 0, Every day
    },
    // CRITICAL IDEMPOTENCY: If you restart the server 10 times, you don't want 10
    // overlapping nightly cron jobs. Hardcoding this jobId forces BullMQ to only register it once.
    jobId: "nightly-analytics-job", 
  });
  console.log("[Scheduler] Nightly Analytics Cron scheduled (00:01 daily)");

  // Feature 5: Crowd Prediction Worker
  // Runs at the top of every hour to measure patient velocity
  await crowdQueue.add("hourly-crowd-prediction", {}, {
    repeat: {
      cron: "0 * * * *", // Minute 0, Every hour
    },
    jobId: "hourly-crowd-job",
  });
  console.log("[Scheduler] Hourly Crowd Prediction Cron scheduled");

  // Feature 6: Expired Token Cleanup
  // Runs every 30 minutes to permanently cancel abandoned tokens
  await cleanupQueue.add("cleanup-expired-tokens", {}, {
    repeat: {
      cron: "*/30 * * * *", // Every 30 minutes
    },
    jobId: "cleanup-tokens-job",
  });
  console.log("[Scheduler] Expired Token Cleanup Cron scheduled (Every 30m)");
};

module.exports = {
  startCronJobs,
};
