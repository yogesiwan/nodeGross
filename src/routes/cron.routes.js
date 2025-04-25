const express = require('express');
const router = express.Router();
const cronController = require('../controllers/cron.controller');
const { upload } = require('../services/resume.service');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/cron/status - Get current cron job status
router.get('/status', cronController.getCronStatus);

// POST /api/cron/schedule - Schedule a new cron job
router.post('/schedule', cronController.scheduleJob);

// POST /api/cron/stop - Stop the running cron job
router.post('/stop', cronController.stopJob);

// POST /api/cron/run-now - Run the cron job immediately
router.post('/run-now', cronController.runJobNow);

// POST /api/cron/test-email - Send a test email
router.post('/test-email', cronController.sendTestEmail);

// GET /api/cron/template - Get the current email template
router.get('/template', cronController.getEmailTemplate);

// POST /api/cron/template - Update the email template
router.post('/template', cronController.updateEmailTemplate);

// POST /api/cron/resume - Upload a new resume (replaces existing)
router.post('/resume', upload.single('resume'), cronController.uploadResume);

// GET /api/cron/resume - Get info about the current resume
router.get('/resume', cronController.getResume);

// GET /api/cron/resume/download - Download the current resume
router.get('/resume/download', cronController.downloadResume);

// DELETE /api/cron/resume - Delete all resume files
router.delete('/resume', cronController.deleteResume);

// POST /api/cron/logs - Store incoming logs
router.post('/logs', cronController.takeLogs);

// GET /api/cron/logs - Retrieve stored logs
router.get('/logs', cronController.getLogs);

module.exports = router; 