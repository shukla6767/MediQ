const { Queue } = require("bullmq");
const { defaultQueueOptions } = require("../config/bullmq");

/**
 * ============================================================================
 * DOCTOR AVAILABILITY PRODUCER
 * ============================================================================
 * What this file does:
 * Enqueues an emergency job when a doctor marks themselves as offline/unavailable.
 * 
 * Data Flow:
 * - IN: Receives `{ departmentId, doctorId }`.
 * - OUT: Pushes to `doctor-queue` in Redis, where `doctor.worker.js` will immediately
 *        pause the department in MongoDB and alert all waiting patients.
 */

const doctorQueue = new Queue("doctor-queue", defaultQueueOptions);

/**
 * Pushes a job to pause the department queue when a doctor goes offline.
 * 
 * @param {Object} payload 
 * @param {string} payload.departmentId 
 * @param {string} payload.doctorId
 */
const enqueueDoctorUnavailable = async (payload) => {
  // Prevent duplicate emergency pause events for the same department within the same millisecond
  const jobId = `doctor_offline_${payload.departmentId}_${Date.now()}`;

  await doctorQueue.add("doctor-offline", payload, { jobId });
  console.log(`[Doctor Producer] Job enqueued: ${jobId}`);
};

module.exports = {
  doctorQueue,
  enqueueDoctorUnavailable,
};
