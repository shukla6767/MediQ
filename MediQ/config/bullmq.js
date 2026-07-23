const redisConnection = require("./redis");

/**
 * ============================================================================
 * BULLMQ CONFIGURATION
 * ============================================================================
 * What this file does:
 * Centralizes the default settings for every background queue in the system.
 * 
 * Why do we need this?
 * Without centralized defaults, every single worker (SMS, WhatsApp, Analytics) 
 * would need to manually define its retry logic, leading to duplicated code (violating DRY).
 * 
 * Data Flow:
 * - IN: Receives the active `redisConnection` from config/redis.js.
 * - OUT: Exports `defaultQueueOptions` which is imported by every producer and worker in the app.
 */
const defaultQueueOptions = {
  // Connects BullMQ to our specific Redis instance
  connection: redisConnection,
  
  defaultJobOptions: {
    // If a job (e.g. sending a text message) fails, BullMQ will automatically try it 3 times.
    attempts: 3,                 
    
    // Exponential Backoff: If attempt 1 fails, wait 1 second. 
    // If attempt 2 fails, wait 2 seconds. If attempt 3 fails, wait 4 seconds.
    // This prevents our server from spamming a broken API (like Twilio) and getting IP banned.
    backoff: {
      type: "exponential",       
      delay: 1000,
    },
    
    // Memory Management: We don't want Redis to run out of RAM. 
    // This automatically deletes old jobs from memory, keeping only the most recent ones.
    removeOnComplete: 100,       // Keep the last 100 successful jobs for debugging logs
    removeOnFail: 500,           // Keep the last 500 failed jobs so developers can inspect why they failed
  },
};

module.exports = {
  defaultQueueOptions,
  redisConnection, // Exported here just so workers can easily grab both from one file
};
