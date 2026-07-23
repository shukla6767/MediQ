const Redis = require("ioredis");

/**
 * ============================================================================
 * REDIS CONNECTION CONFIGURATION
 * ============================================================================
 * What this file does:
 * Establishes a single, reusable connection to the Redis server for the entire backend.
 * 
 * Why ioredis instead of standard 'redis'?
 * BullMQ (our queueing engine) specifically requires `ioredis` because it has native
 * support for complex Lua scripts, Promise-based structures, and automatic reconnections.
 * 
 * Data Flow:
 * - OUT: This connection object is exported and imported by BullMQ workers, rate limiters,
 *   and caching services (like the admin dashboard) to communicate with the Redis server.
 */

const redisConnection = new Redis(process.env.REDIS_URL || "redis://127.0.0.1:6379", {
  // maxRetriesPerRequest must be null for BullMQ to properly handle blocking commands
  // without throwing timeout errors when a queue is waiting for a job to arrive.
  maxRetriesPerRequest: null, 
  enableReadyCheck: false,
});

// Event listeners for basic observability in the terminal
redisConnection.on("error", (err) => {
  console.error("[Redis] Connection error:", err.message);
});

redisConnection.on("connect", () => {
  console.log("[Redis] Connected successfully.");
});

module.exports = redisConnection;
