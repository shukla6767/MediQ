const { Worker } = require("bullmq");
const { redisConnection } = require("../config/bullmq");
const Token = require("../models/Token");
const Department = require("../models/Department");

/**
 * ============================================================================
 * HOURLY CROWD PREDICTION WORKER (CRON CONSUMER)
 * ============================================================================
 * What this file does:
 * Calculates the real-time "velocity" of how fast a queue is moving and stores
 * a HIGH/MEDIUM/LOW prediction directly into Redis memory.
 * 
 * Why Redis instead of MongoDB?
 * Patients check the "Is it crowded right now?" feature constantly from their phones.
 * If 1,000 patients checked simultaneously, querying MongoDB 1,000 times would crash it.
 * Reading a tiny string from Redis RAM takes <1 millisecond and supports millions of hits.
 */

const handleCrowdPredictionJob = async () => {
  console.log("[Crowd Worker] Calculating hourly crowd prediction...");

  // 1. Establish the "last 60 minutes" window
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  // 2. We calculate predictions PER department, not for the whole hospital
  const departments = await Department.find().select("_id name");

  for (const dept of departments) {
    // Metric A: Velocity (How many people entered the queue in the last hour?)
    const newBookings = await Token.countDocuments({
      departmentId: dept._id,
      createdAt: { $gte: oneHourAgo }
    });

    // Metric B: Backlog (How many people are currently sitting in the waiting room?)
    const currentlyWaiting = await Token.countDocuments({
      departmentId: dept._id,
      status: "WAITING"
    });

    let crowdStatus = "LOW";
    
    // 3. Simple Heuristic Algorithm
    // If the waiting room is packed (Backlog > 20) OR people are flooding in (Velocity > 30)
    if (currentlyWaiting > 20 || newBookings > 30) {
      crowdStatus = "HIGH";
    } else if (currentlyWaiting > 10 || newBookings > 15) {
      crowdStatus = "MEDIUM";
    }

    // 4. Construct the Cache Payload
    const payload = {
      status: crowdStatus,
      waitingCount: currentlyWaiting,
      velocity: newBookings,
      updatedAt: new Date().toISOString()
    };

    // 5. Save to Redis
    const redisKey = `crowd_prediction:${dept._id}`;
    
    // setex(key, seconds_to_live, value)
    // A TTL of 7200 seconds (2 hours) is used. If this cron worker crashes next hour,
    // the data will eventually auto-delete, preventing the frontend from showing a permanently
    // stale "HIGH" warning forever.
    await redisConnection.setex(redisKey, 7200, JSON.stringify(payload));
  }

  console.log(`[Crowd Worker] Crowd prediction cached in Redis for ${departments.length} departments.`);
  
  return { status: "success", departmentsProcessed: departments.length };
};

const crowdWorker = new Worker("crowd-queue", handleCrowdPredictionJob, {
  connection: redisConnection,
  concurrency: 1,
});

crowdWorker.on("completed", () => {
  console.log(`[Crowd Worker] Hourly prediction finished.`);
});

crowdWorker.on("failed", (job, err) => {
  console.error(`[Crowd Worker] Job failed: ${err.message}`);
});

module.exports = crowdWorker;
