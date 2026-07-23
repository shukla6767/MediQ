const { Queue } = require("bullmq");
const { defaultQueueOptions } = require("../config/bullmq");

/**
 * ============================================================================
 * WHATSAPP PRODUCER (PUBLISHER)
 * ============================================================================
 * What this file does:
 * Similar to the SMS producer, this file strictly handles creating WhatsApp messaging tasks.
 * 
 * Data Flow:
 * - IN: Receives `{ phoneNumber, message }` from `queue.controllers.js`.
 * - OUT: Serializes it to Redis `whatsapp-queue` where `whatsapp.worker.js` consumes it.
 */

const whatsappQueue = new Queue("whatsapp-queue", defaultQueueOptions);

/**
 * Pushes a new WhatsApp job into the BullMQ queue.
 * 
 * @param {Object} payload 
 * @param {string} payload.phoneNumber - The recipient's phone number
 * @param {string} payload.message - The content of the WhatsApp message
 */
const enqueueWhatsapp = async (payload) => {
  // Generate a predictable job ID to prevent duplicate messages during race conditions
  const jobId = `wa_${payload.phoneNumber}_${Date.now()}`;

  await whatsappQueue.add("send-whatsapp", payload, {
    jobId, 
  });

  console.log(`[WhatsApp Producer] Job enqueued: ${jobId}`);
};

module.exports = {
  whatsappQueue,
  enqueueWhatsapp,
};
