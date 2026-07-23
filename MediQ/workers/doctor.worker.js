const { Worker } = require("bullmq");
const { redisConnection } = require("../config/bullmq");
const Department = require("../models/Department");
const Token = require("../models/Token");
const { enqueueSms } = require("../jobs/sms.producer");

/**
 * ============================================================================
 * DOCTOR AVAILABILITY WORKER (EMERGENCY CONSUMER)
 * ============================================================================
 * What this file does:
 * Automatically pauses a hospital department and notifies all patients if a doctor
 * marks themselves as offline or unavailable.
 * 
 * Data Flow:
 * 1. IN: Receives `{ departmentId }` from Redis.
 * 2. ACTION A: Hits MongoDB to flip `isPaused: true` on the Department model.
 * 3. ACTION B: Pulls an array of all WAITING patients in that department.
 * 4. ACTION C: Loops through the array and rapidly delegates SMS jobs back to the `sms-queue`.
 */

const handleDoctorJob = async (job) => {
  const { departmentId, doctorId } = job.data;

  console.log(`[Doctor Worker] Processing offline event for department ${departmentId}`);

  // 1. Pause the department
  await Department.findByIdAndUpdate(departmentId, {
    $set: { isPaused: true }
  });

  // 2. Fetch all patients currently sitting in the waiting room
  // We use `.populate("patientId")` because the Token model only stores the Patient's ID,
  // but we need the actual User document to get their phone number.
  const waitingPatients = await Token.find({
    department: departmentId,
    status: "WAITING"
  }).populate("patientId");

  let notificationsSent = 0;

  // 3. The Notification Loop
  for (const patient of waitingPatients) {
    if (patient.patientId && patient.patientId.phone) {
      const message = `Notice: The doctor for Token #${patient.tokenNumber} is temporarily unavailable. The queue is paused. We will notify you when it resumes.`;
      
      // CRITICAL ARCHITECTURE DECISION:
      // Notice we do NOT use the `await` keyword here!
      // If there are 200 patients waiting, we don't want this loop to pause for 500ms
      // on every single iteration waiting for Twilio. By omitting `await`, this loop 
      // instantly fires off 200 jobs into the `sms-queue` memory in less than 50 milliseconds,
      // delegating the slow network bottleneck to the dedicated SMS workers.
      enqueueSms({
        phoneNumber: patient.patientId.phone,
        message,
      }).catch(err => console.error(`[Doctor Worker] Failed to enqueue SMS: ${err.message}`));
      
      notificationsSent++;
    }
  }

  return { status: "success", departmentPaused: departmentId, patientsNotified: notificationsSent };
};

const doctorWorker = new Worker("doctor-queue", handleDoctorJob, {
  connection: redisConnection,
  concurrency: 1, 
});

doctorWorker.on("completed", (job, returnvalue) => {
  console.log(`[Doctor Worker] Job completed. Notified ${returnvalue.patientsNotified} patients.`);
});

doctorWorker.on("failed", (job, err) => {
  console.error(`[Doctor Worker] Job failed: ${err.message}`);
});

module.exports = doctorWorker;
