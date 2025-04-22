const cron = require('node-cron');
const { processTodaysJobsAndSendEmails } = require('./email-job.service');
const cronConfig = require('../config/cron.config');

// Active scheduled tasks
const activeTasks = new Map();

/**
 * Convert a cron schedule from IST to UTC
 * Indian Standard Time is UTC+5:30
 * @param {string} schedule - Cron schedule expression in IST
 * @returns {string} Cron schedule in UTC
 */
function convertISTtoUTC(schedule) {
  // Parse the cron schedule
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) {
    console.error(`❌ Invalid cron format: ${schedule}`);
    return schedule;
  }

  // Extract minute and hour
  let [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

  // Skip conversion for special characters
  if (hour === '*' || hour.includes(',') || hour.includes('-') || hour.includes('/')) {
    console.log('⚠️ Complex hour pattern detected, skipping time zone conversion');
    return schedule;
  }

  // Convert hour from IST to UTC (subtract 5:30)
  let hourNum = parseInt(hour, 10);
  let minuteNum = parseInt(minute, 10);

  // Subtract 5 hours and 30 minutes
  minuteNum -= 30;
  if (minuteNum < 0) {
    minuteNum += 60;
    hourNum -= 1;
  }
  hourNum -= 5;

  // Handle day change
  if (hourNum < 0) {
    hourNum += 24;
    
    // If specific day is mentioned, adjust it
    if (dayOfMonth !== '*') {
      const dayNum = parseInt(dayOfMonth, 10);
      // This is a simplification - doesn't account for month boundaries
      dayOfMonth = String(dayNum === 1 ? 28 : dayNum - 1); // approximation
    }
    
    // If specific day of week is mentioned, adjust it
    if (dayOfWeek !== '*') {
      const dowNum = parseInt(dayOfWeek, 10);
      dayOfWeek = String(dowNum === 0 ? 6 : dowNum - 1);
    }
  }

  // Format back to cron syntax
  const utcSchedule = `${minuteNum} ${hourNum} ${dayOfMonth} ${month} ${dayOfWeek}`;
  console.log(`🕒 Converted cron schedule: ${schedule} (IST) -> ${utcSchedule} (UTC)`);
  
  return utcSchedule;
}

/**
 * Schedule a new email job
 * @param {string} schedule - Cron schedule expression (in IST)
 * @returns {Promise<boolean>} True if scheduled successfully
 */
async function scheduleEmailJob(schedule) {
  try {
    if (!cron.validate(schedule)) {
      console.error(`❌ Invalid cron schedule: ${schedule}`);
      return false;
    }

    // Convert IST schedule to UTC for server execution
    const utcSchedule = convertISTtoUTC(schedule);

    // Stop any existing job with the same ID
    await stopEmailJob();

    // Schedule the job
    const task = cron.schedule(utcSchedule, async () => {
      const now = new Date();
      const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
      console.log(`⏰ Running scheduled email job at ${istTime.toISOString()} IST (${now.toISOString()} UTC)`);
      
      try {
        const result = await processTodaysJobsAndSendEmails();
        console.log(`📧 Job complete: ${result.emailsSent} sent, ${result.emailsFailed} failed`);
      } catch (err) {
        console.error('❌ Error in scheduled job:', err);
      }
    });

    // Store the task with both IST and UTC schedules
    activeTasks.set(cronConfig.configId, {
      task,
      schedule: schedule, // Store original IST schedule
      utcSchedule,        // Store converted UTC schedule
      startedAt: new Date().toISOString()
    });

    console.log(`✅ Job scheduled with cron: ${schedule} (IST) / ${utcSchedule} (UTC)`);
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
      console.log(`🛑 Job with schedule '${taskInfo.schedule}' (IST) stopped`);
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
      schedule: taskInfo ? taskInfo.schedule : null, // Return IST schedule
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
