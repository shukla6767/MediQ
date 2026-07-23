const { Worker } = require("bullmq");
const { redisConnection } = require("../config/bullmq");
const Token = require("../models/Token");
const Analytics = require("../models/Analytics");

/**
 * ============================================================================
 * NIGHTLY ANALYTICS WORKER (CRON CONSUMER)
 * ============================================================================
 * What this file does:
 * Runs mathematically heavy calculations (Wait time, patients served, peak hours).
 * 
 * Why background processing?
 * If the Admin dashboard tried to run these calculations across 50,000 token records
 * during an HTTP request, the browser would time out and the DB would lock up.
 * This cron job runs at midnight, calculates everything once, and saves the final
 * numbers to a dedicated `Analytics` collection for lightning-fast reads later.
 */

const handleAnalyticsJob = async () => {
  console.log("[Analytics Worker] Starting nightly analytics compilation...");

  // 1. Define the timeframe for "yesterday"
  const startOfYesterday = new Date();
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  startOfYesterday.setHours(0, 0, 0, 0); // 00:00:00

  const endOfYesterday = new Date();
  endOfYesterday.setDate(endOfYesterday.getDate() - 1);
  endOfYesterday.setHours(23, 59, 59, 999); // 23:59:59

  // 2. Fetch all tokens that were successfully marked "COMPLETED" yesterday
  const completedTokens = await Token.find({
    status: "COMPLETED",
    completedAt: { $gte: startOfYesterday, $lte: endOfYesterday },
  });

  const totalPatientsServed = completedTokens.length;

  if (totalPatientsServed === 0) {
    console.log("[Analytics Worker] No patients served yesterday. Skipping aggregation.");
    return { status: "no_data" };
  }

  // 3. Mathematical Aggregation
  let totalWaitTimeMs = 0;
  const hourCounts = {}; // Dictionary to track which hour (0-23) had the most tokens called

  completedTokens.forEach((token) => {
    if (token.calledAt && token.createdAt) {
      totalWaitTimeMs += token.calledAt - token.createdAt;
    }
    
    if (token.completedAt) {
      const hour = token.completedAt.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
  });

  // Convert total wait milliseconds into an average in minutes
  const averageWaitTimeMinutes = Math.round((totalWaitTimeMs / totalPatientsServed) / (1000 * 60));

  // Find Peak Hour (the hour with the maximum count in hourCounts)
  let peakHour = null;
  let maxCount = 0;
  for (const [hour, count] of Object.entries(hourCounts)) {
    if (count > maxCount) {
      maxCount = count;
      peakHour = parseInt(hour, 10);
    }
  }

  // 4. UPSERT into Database
  // We use `findOneAndUpdate` with `{ upsert: true }`. 
  // Why? If this cron job crashes halfway and BullMQ retries it, we don't want to insert 
  // duplicate analytic records for yesterday. Upsert guarantees it either updates the existing
  // record for yesterday or creates precisely one new one.
  await Analytics.findOneAndUpdate(
    { date: startOfYesterday },
    {
      $set: {
        date: startOfYesterday,
        totalPatientsServed,
        averageWaitTimeMinutes,
        peakHour,
      },
    },
    { upsert: true, new: true }
  );

  console.log(`[Analytics Worker] Aggregation complete for ${startOfYesterday.toDateString()}. Patients: ${totalPatientsServed}, Avg Wait: ${averageWaitTimeMinutes}m`);

  return { status: "success", totalPatientsServed, averageWaitTimeMinutes };
};

// Define Worker (Concurrency 1 ensures we only ever run one nightly cron job at a time)
const analyticsWorker = new Worker("analytics-queue", handleAnalyticsJob, {
  connection: redisConnection,
  concurrency: 1, 
});

analyticsWorker.on("completed", (job) => {
  console.log(`[Analytics Worker] Job completed successfully.`);
});

analyticsWorker.on("failed", (job, err) => {
  console.error(`[Analytics Worker] Job failed: ${err.message}`);
});

module.exports = analyticsWorker;
