const { Worker } = require("bullmq");
const twilio = require("twilio");
const { redisConnection } = require("../config/bullmq");

/**
 * ============================================================================
 * WHATSAPP WORKER (CONSUMER)
 * ============================================================================
 * What this file does:
 * Listens to the "whatsapp-queue" in Redis and dispatches WhatsApp messages via Twilio.
 * 
 * Why a separate worker?
 * By keeping SMS and WhatsApp in completely separate queues, if the WhatsApp API goes down,
 * it won't block the SMS messages from sending. This is the definition of robust Microservices.
 */

// Graceful initialization (fallback to mock mode if keys are missing)
const twilioClient =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

const handleWhatsappJob = async (job) => {
  const { phoneNumber, message } = job.data;

  if (!phoneNumber || !message) {
    throw new Error("Missing phoneNumber or message in job data");
  }

  // Twilio's WhatsApp API specifically requires phone numbers to be prefixed with "whatsapp:"
  const formattedNumber = phoneNumber.startsWith("whatsapp:") ? phoneNumber : `whatsapp:${phoneNumber}`;
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886"; // Default Twilio Sandbox Number

  // MOCK MODE
  if (!twilioClient) {
    console.log(`[WhatsApp Worker - MOCK] Sending to ${formattedNumber}: "${message}"`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { status: "mock_success" };
  }

  // PRODUCTION MODE: Fire the real HTTP request to Twilio's WhatsApp API.
  try {
    const response = await twilioClient.messages.create({
      body: message,
      from: fromNumber,
      to: formattedNumber,
    });
    console.log(`[WhatsApp Worker] Successfully sent message to ${formattedNumber} (SID: ${response.sid})`);
    return { status: "success", sid: response.sid };
  } catch (error) {
    console.error(`[WhatsApp Worker] API Error: ${error.message}`);
    throw error;
  }
};

const whatsappWorker = new Worker("whatsapp-queue", handleWhatsappJob, {
  connection: redisConnection,
  concurrency: 5,
});

whatsappWorker.on("completed", (job, returnvalue) => {
  console.log(`[WhatsApp Worker] Job ${job.id} completed!`, returnvalue);
});

whatsappWorker.on("failed", (job, err) => {
  console.log(`[WhatsApp Worker] Job ${job.id} failed: ${err.message}`);
});

module.exports = whatsappWorker;
