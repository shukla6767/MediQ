const { Worker } = require("bullmq");
const { redisConnection } = require("../config/bullmq");
const Token = require("../models/Token");

/**
 * ============================================================================
 * EXPIRED TOKEN CLEANUP WORKER (CRON CONSUMER)
 * ============================================================================
 * What this file does:
 * Automatically cleans up abandoned database records to prevent permanent bloat.
 * 
 * Why is this needed?
 * A user books a token but never shows up. The receptionist never clicks "Call Next".
 * The token sits in "WAITING" status forever. This worker runs every 30 minutes, 
 * looks for any WAITING token older than 12 hours, and silently marks it CANCELLED.
 */

const handleCleanupJob = async () => {
  console.log("[Cleanup Worker] Scanning for expired tokens...");

  // Calculate exactly 12 hours into the past
  const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);

  // BULK UPDATE (Highly Optimized for MongoDB)
  // Instead of querying 1,000 tokens into Node.js RAM and looping through them one by one,
  // we send a single `updateMany` command to the database engine.
  const result = await Token.updateMany(
    {
      status: "WAITING",
      createdAt: { $lte: twelveHoursAgo }, // "lte" = Less Than or Equal To
    },
    {
      $set: { status: "CANCELLED" },
    }
  );

  console.log(`[Cleanup Worker] Cleaned up ${result.modifiedCount} expired WAITING tokens.`);

  return { status: "success", cleaned: result.modifiedCount };
};

const cleanupWorker = new Worker("cleanup-queue", handleCleanupJob, {
  connection: redisConnection,
  concurrency: 1,
});

cleanupWorker.on("completed", (job, returnvalue) => {
  console.log(`[Cleanup Worker] Job completed. Cleaned: ${returnvalue.cleaned}`);
});

cleanupWorker.on("failed", (job, err) => {
  console.error(`[Cleanup Worker] Job failed: ${err.message}`);
});

module.exports = cleanupWorker;
