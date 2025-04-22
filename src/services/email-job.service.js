const { getTodayDateString } = require('../utils/date.utils');
const { findJobsWithEmails } = require('./job.service');
const { sendEmail } = require('./email.service');

/**
 * Process jobs and send emails
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Promise<Object>} Result with counts of sent and failed emails
 */
async function processJobsAndSendEmails(date) {
  const jobs = await findJobsWithEmails(date);
  if (jobs.length === 0) {
    console.log('📭 No jobs with email addresses found for date', date);
    return {
      success: true,
      emailsSent: 0,
      emailsFailed: 0
    };
  }
  console.log(`📨 Found ${jobs.length} jobs with email addresses to process for date ${date}`);
  
  
  let emailsSent = 0;
  let emailsFailed = 0;

  // Process each job and send email
  for (const job of jobs) {
    if (!job.send_to) continue;
    
    console.log(`🔄 Processing job: ${job.title} at ${job.company}`);
    
    const emailParams = {
      recipientEmail: job.send_to,
      recipientName: job.recipient_name || '',
      jobTitle: job.title,
      companyName: job.company,
      applicationDate: job.date_applied,
      jobId: job.job_id,
    };

    
    const success = await sendEmail(emailParams);
    
    if (success) {
      emailsSent++;
      console.log(`✅ Email sent successfully to ${job.send_to}`);
    } else {
      emailsFailed++;
      console.error(`❌ Failed to send email to ${job.send_to}`);
    }
  }
  
  console.log(`📊 Email sending summary:
  - Total processed: ${jobs.length}
  - Emails sent: ${emailsSent}
  - Failed: ${emailsFailed}`);
  
  return {
    success: emailsFailed === 0,
    emailsSent,
    emailsFailed
  };
}

/**
 * Process today's jobs and send emails
 * @returns {Promise<Object>} Result with counts of sent and failed emails
 */
async function processTodaysJobsAndSendEmails() {
  const today = getTodayDateString();
  return processJobsAndSendEmails(today);
}

module.exports = {
  processTodaysJobsAndSendEmails
}; 