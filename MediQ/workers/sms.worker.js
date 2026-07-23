const { Worker } = require("bullmq");
const twilio = require("twilio");
const { redisConnection } = require("../config/bullmq");

/**
 * ============================================================================
 * SMS WORKER (CONSUMER)
 * ============================================================================
 * What this file does:
 * This is a background thread that constantly listens to the "sms-queue" in Redis.
 * When a job arrives, it executes the Twilio HTTP request to send a physical text message.
 * 
 * Data Flow:
 * 1. IN: Pulls a Job object from Redis containing `{ phoneNumber, message }`.
 * 2. ACTION: Hits the Twilio REST API.
 * 3. OUT: Returns success to BullMQ, or throws an error which forces BullMQ to retry later.
 */

// Initialize Twilio client ONLY if credentials exist.
// This is "Graceful Degradation". It prevents the Node.js server from crashing with a fatal error 
// if a developer runs this project locally without providing Twilio API keys in their .env file.
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

/**
 * The core Job Handler function.
 * If this function throws an Error, BullMQ catches it and applies the exponential backoff 
 * retry strategy defined in `config/bullmq.js`.
 */
const handleSmsJob = async (job) => {
  const { phoneNumber, message } = job.data;

  if (!phoneNumber || !message) {
    throw new Error("Missing phoneNumber or message in job data");
  }

  // MOCK MODE: If the user doesn't have Twilio credentials, simulate a 500ms network 
  // delay and print the text to the terminal. This keeps local development fast and crash-free.
  if (!twilioClient) {
    console.log(`[SMS Worker - MOCK] Sending SMS to ${phoneNumber}: "${message}"`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { status: "mock_success" };
  }

  // PRODUCTION MODE: Fire the real HTTP request to Twilio.
  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    console.log(`[SMS Worker] Successfully sent SMS to ${phoneNumber} (SID: ${response.sid})`);
    return { status: "success", sid: response.sid };
  } catch (error) {
    console.error(`[SMS Worker] Twilio API Error: ${error.message}`);
    // Throwing the error is critical! It tells BullMQ the job failed so it triggers a retry.
    throw error;
  }
};

// Define the Worker. Concurrency: 5 means it can send 5 SMS messages simultaneously.
const smsWorker = new Worker("sms-queue", handleSmsJob, {
  connection: redisConnection,
  concurrency: 5, 
});

smsWorker.on("completed", (job, returnvalue) => {
  console.log(`[SMS Worker] Job ${job.id} completed!`, returnvalue);
});

smsWorker.on("failed", (job, err) => {
  console.log(`[SMS Worker] Job ${job.id} failed with reason: ${err.message}`);
});

module.exports = smsWorker;
