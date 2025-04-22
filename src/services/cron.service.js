const cron = require('node-cron');
const { processTodaysJobsAndSendEmails } = require('./email-job.service');
const cronConfig = require('../config/cron.config');

// Active scheduled tasks
const activeTasks = new Map();

/**
 * Schedule a new email job
 * @param {string} schedule - Cron schedule expression
 * @returns {Promise<boolean>} True if scheduled successfully
 */
async function scheduleEmailJob(schedule) {
  try {
    if (!cron.validate(schedule)) {
      console.error(`❌ Invalid cron schedule: ${schedule}`);
      return false;
    }

    // Stop any existing job with the same ID
    await stopEmailJob();

    // Schedule the job
    const task = cron.schedule(schedule, async () => {
      console.log(`⏰ Running scheduled email job at ${new Date().toISOString()}`);
      try {
        const result = await processTodaysJobsAndSendEmails();
        console.log(`📧 Job complete: ${result.emailsSent} sent, ${result.emailsFailed} failed`);
      } catch (err) {
        console.error('❌ Error in scheduled job:', err);
      }
    });

    // Store the task
    activeTasks.set(cronConfig.configId, {
      task,
      schedule,
      startedAt: new Date().toISOString()
    });

    console.log(`✅ Job scheduled with cron: ${schedule}`);
    return true;
  } catch (error) {
    console.error('❌ Error scheduling job:', error);
    return false;
  }
}

/**
 * Stop the scheduled email job
 * @returns {Promise<boolean>}
 */
async function stopEmailJob() {
  try {
    const taskInfo = activeTasks.get(cronConfig.configId);

    if (taskInfo) {
      taskInfo.task.stop();
      activeTasks.delete(cronConfig.configId);
      console.log(`🛑 Job with schedule '${taskInfo.schedule}' stopped`);
      return true;
    }

    console.log('ℹ️ No active job to stop');
    return true;
  } catch (error) {
    console.error('❌ Error stopping job:', error);
    return false;
  }
}

/**
 * Run the email job immediately
 * @returns {Promise<Object>}
 */
async function runEmailJobNow() {
  console.log('🚀 Running job immediately');
  return processTodaysJobsAndSendEmails();
}

/**
 * Get current email job status
 * @returns {Promise<Object>}
 */
async function getEmailJobStatus() {
  try {
    const taskInfo = activeTasks.get(cronConfig.configId);

    return {
      scheduled: !!taskInfo,
      schedule: taskInfo ? taskInfo.schedule : null,
      startedAt: taskInfo ? taskInfo.startedAt : null
    };
  } catch (error) {
    console.error('❌ Error fetching job status:', error);
    return {
      scheduled: false,
      schedule: null,
      error: error.message
    };
  }
}

module.exports = {
  scheduleEmailJob,
  stopEmailJob,
  runEmailJobNow,
  getEmailJobStatus
};
