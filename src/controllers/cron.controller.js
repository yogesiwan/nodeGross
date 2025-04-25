const fs = require('fs').promises;
const path = require('path');
const os = require('os');

let lastLogActivity = Date.now();
let logCleanupTimer = null;
const LOG_CLEANUP_DELAY = 2 * 60 * 1000; // 5 minutes in milliseconds
const tempLogFile = path.join(os.tmpdir(), 'application-logs-temp.txt');

// Import template model
const {
  getTemplate,
  updateTemplate,
  initializeDefaultTemplate
} = require('../models/Template');

// Import resume service
const {
  upload,
  listResumes,
  deleteExistingResumes,
  getActiveResume
} = require('../services/resume.service');

// ✅ Hot-reloadable config helper
function getEmailConfig() {
  delete require.cache[require.resolve('../config/email.config')];
  return require('../config/email.config');
}

const { 
  scheduleEmailJob, 
  stopEmailJob, 
  runEmailJobNow, 
  getEmailJobStatus,
} = require('../services/cron.service');

const { sendEmail, generateEmailContent } = require('../services/email.service');

/**
 * Get the current status of the cron job
 */
async function getCronStatus(req, res) {
  try {
    const status = await getEmailJobStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting cron status:', error);
    res.status(500).json({ error: 'Failed to get cron status' });
  }
}

/**
 * Schedule a new cron job
 */
async function scheduleJob(req, res) {
  try {
    const { schedule } = req.body;
    
    if (!schedule) {
      return res.status(400).json({ error: 'Schedule is required' });
    }
    
    const success = await scheduleEmailJob(schedule);
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Cron job scheduled successfully',
        schedule
      });
    } else {
      res.status(400).json({ error: 'Failed to schedule cron job' });
    }
  } catch (error) {
    console.error('Error scheduling cron job:', error);
    res.status(500).json({ error: 'Failed to schedule cron job' });
  }
}

/**
 * Stop the running cron job
 */
async function stopJob(req, res) {
  try {
    const success = await stopEmailJob();
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Cron job stopped successfully' 
      });
    } else {
      res.status(400).json({ error: 'Failed to stop cron job' });
    }
  } catch (error) {
    console.error('Error stopping cron job:', error);
    res.status(500).json({ error: 'Failed to stop cron job' });
  }
}

/**
 * Run the cron job immediately
 */
async function runJobNow(req, res) {
  try {
    const result = await runEmailJobNow();
    
    res.json({
      success: result.success,
      message: `Email job completed: ${result.emailsSent} sent, ${result.emailsFailed} failed`,
      ...result
    });
  } catch (error) {
    console.error('Error running cron job:', error);
    res.status(500).json({ error: 'Failed to run cron job' });
  }
}

/**
 * Send a test email
 */



async function sendTestEmail(req, res) {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    
    const emailParams = {
      recipientEmail: email,
      recipientName: '',
      jobTitle: 'SDE-II',
      companyName: 'Google',
      applicationDate: new Date().toLocaleDateString(),
      jobId: 'test_job_123'
    };
    
    const success = await sendEmail(emailParams);
    
    if (success) {
      return res.status(200).json({
        success: true,
        message: `Test email sent to ${email}`
      });
    } else {
      throw new Error('Failed to send test email');
    }
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
}

/**
 * Get the current email template (subject and body)
 */
async function getEmailTemplate(req, res) {
  try {
    // Initialize default template if needed
    await initializeDefaultTemplate();
    
    // Get the template
    const template = await getTemplate();
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'No template found in the database'
      });
    }
    
    res.status(200).json({
      success: true,
      template: {
        subject: template.subject,
        body: template.body,
        updatedAt: template.updatedAt
      }
    });
    console.log('Email template retrieved successfully');
  } catch (error) {
    console.error('Error retrieving email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email template',
      error: error.message
    });
  }
}

/**
 * Update the email template
 */
async function updateEmailTemplate(req, res) {
  try {
    const { subject, body } = req.body;
    
    // Validate required fields
    if (!subject && !body) {
      return res.status(400).json({
        success: false,
        message: 'Either subject or body must be provided'
      });
    }
    
    // Initialize default template if needed
    await initializeDefaultTemplate();
    
    // Get current template to only update provided fields
    const currentTemplate = await getTemplate();
    
    // Create update object with only provided fields
    const updates = {};
    if (subject) updates.subject = subject;
    if (body) updates.body = body;
    
    // Update the template
    const updatedTemplate = await updateTemplate({
      subject: subject || currentTemplate.subject,
      body: body || currentTemplate.body
    });
    
    res.status(200).json({
      success: true,
      message: 'Email template updated successfully',
      template: {
        subject: updatedTemplate.subject,
        body: updatedTemplate.body,
        updatedAt: updatedTemplate.updatedAt
      }
    });
    console.log('Email template updated successfully');
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update email template',
      error: error.message
    });
  }
}

/**
 * Upload a new resume
 * Middleware handles file upload, this function handles response
 */
async function uploadResume(req, res) {
  try {
    // Check if file was uploaded successfully
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No resume file uploaded'
      });
    }
    
    // File details are available in req.file
    const { filename, size, mimetype, path: filePath } = req.file;
    
    // Return success response with file details
    res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      resume: {
        filename,
        size,
        mimetype,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error uploading resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload resume',
      error: error.message
    });
  }
}

/**
 * Get the currently active resume file
 */
async function getResume(req, res) {
  try {
    const resume = await getActiveResume();
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }
    
    res.status(200).json({
      success: true,
      resume
    });
  } catch (error) {
    console.error('Error getting resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get resume',
      error: error.message
    });
  }
}

/**
 * Download the currently active resume file
 */
async function downloadResume(req, res) {
  try {
    const resume = await getActiveResume();
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'No resume found'
      });
    }
    
    const filePath = path.join(path.dirname(require.resolve('../services/resume.service')), '../utils/resume', resume.filename);
    
    // Set content disposition header to trigger download
    res.setHeader('Content-Disposition', `attachment; filename="${resume.filename}"`);
    res.setHeader('Content-Type', 'application/pdf');
    
    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download resume',
      error: error.message
    });
  }
}

/**
 * Delete all resume files
 */
async function deleteResume(req, res) {
  try {
    const deletedCount = await deleteExistingResumes();
    
    res.status(200).json({
      success: true,
      message: `${deletedCount} resume file(s) deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting resumes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resume files',
      error: error.message
    });
  }
}


/**
 * Store incoming logs in a temporary file
 */
async function takeLogs(req, res) {
  try {
    const { message, timestamp } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Log message is required'
      });
    }
    
    // Format the log entry with timestamp
    const logTime = timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
    const logEntry = `[${logTime}] ${message}\n`;
    
    // Append to temp file
    await fs.appendFile(tempLogFile, logEntry);
    
    // Update last activity time
    lastLogActivity = Date.now();
    
    // Set up cleanup timer if not already running
    if (!logCleanupTimer) {
      logCleanupTimer = setTimeout(cleanupLogFile, LOG_CLEANUP_DELAY);
    }
    
    res.status(200).json({
      success: true,
      message: 'Log stored successfully'
    });
  } catch (error) {
    console.error('Error storing log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store log',
      error: error.message
    });
  }
}

/**
 * Retrieve all logs from the temporary file
 */
/**
 * Retrieve logs from the temporary file with pagination and "tail" support
 */
async function getLogs(req, res) {
  try {
    // Check if log file exists
    try {
      await fs.access(tempLogFile);
    } catch (error) {
      // File doesn't exist
      return res.status(200).json({
        success: true,
        logs: [],
        total: 0,
        message: 'No logs available'
      });
    }
    
    // Reset the cleanup timer since there's activity
    lastLogActivity = Date.now();
    if (logCleanupTimer) {
      clearTimeout(logCleanupTimer);
      logCleanupTimer = setTimeout(cleanupLogFile, LOG_CLEANUP_DELAY);
    }
    
    // Parse pagination parameters
    const limit = parseInt(req.query.limit) || 100; // Default 100 lines
    const page = parseInt(req.query.page) || 1;
    const tail = req.query.tail === 'true'; // If true, return the most recent logs
    const since = req.query.since ? parseInt(req.query.since) : null; // Timestamp to get logs after a certain point
    
    // Read log file
    const fileContent = await fs.readFile(tempLogFile, 'utf8');
    const allLogLines = fileContent.split('\n').filter(line => line.trim()); // Filter empty lines
    const total = allLogLines.length;
    
    let resultLogs = [];
    
    if (since) {
      // Get only logs newer than the specified timestamp
      resultLogs = allLogLines.filter(line => {
        try {
          const timestampMatch = line.match(/\[(.*?)\]/);
          if (timestampMatch) {
            const logDate = new Date(timestampMatch[1]);
            return logDate.getTime() > since;
          }
          return false;
        } catch (e) {
          return false;
        }
      });
    } else if (tail) {
      // Get the most recent logs based on limit
      resultLogs = allLogLines.slice(-limit);
    } else {
      // Paginate logs
      const start = (page - 1) * limit;
      resultLogs = allLogLines.slice(start, start + limit);
    }
    
    res.status(200).json({
      success: true,
      logs: resultLogs,
      total,
      page: tail ? null : page,
      limit,
      hasMore: !tail && page * limit < total
    });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve logs',
      error: error.message
    });
  }
}

async function cleanupLogFile() {
  const currentTime = Date.now();
  const timeSinceLastActivity = currentTime - lastLogActivity;
  
  // If no activity for cleanup delay, delete the file
  if (timeSinceLastActivity >= LOG_CLEANUP_DELAY) {
    try {
      await fs.unlink(tempLogFile);
    } catch (error) {
      // File might not exist or other error
      console.error('Error cleaning up log file:', error);
    } finally {
      logCleanupTimer = null;
    }
  } else {
    // If there was activity, reschedule
    const remainingTime = LOG_CLEANUP_DELAY - timeSinceLastActivity;
    logCleanupTimer = setTimeout(cleanupLogFile, remainingTime);
  }
}



module.exports = {
  getCronStatus,
  scheduleJob,
  stopJob,
  runJobNow,
  sendTestEmail,
  getEmailTemplate,
  updateEmailTemplate,
  uploadResume,
  getResume,
  downloadResume,
  deleteResume,
  takeLogs,  // Add this
  getLogs    // Add this
};