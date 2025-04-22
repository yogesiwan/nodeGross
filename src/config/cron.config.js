require('dotenv').config();

module.exports = {
  // Unique ID for the email cron job configuration document
  configId: 'email_cron',
  
  // Sample job configuration for testing
  testJob: {
    recipientEmail: '',
    jobTitle: "Software Developer",
    companyName: "Google",
    applicationDate: "none",
    jobId: "none"
  }
}; 