const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');
const { getTemplate } = require('../models/Template');

// Create the transporter
const transporter = nodemailer.createTransport({
  host: emailConfig.smtp.host,
  port: emailConfig.smtp.port,
  secure: emailConfig.smtp.secure,
  auth: emailConfig.smtp.auth
});

/**
 * Email template parameters
 * @typedef {Object} EmailTemplateParams
 * @property {string} recipientEmail - Recipient email address
 * @property {string} jobTitle - Job title
 * @property {string} companyName - Company name
 * @property {string} applicationDate - Application date
 * @property {string} jobId - Job ID
 * @property {Object} [resume] - Optional resume data for attachment
 * @property {string} [customSubject] - Optional custom email subject
 * @property {string} [customTemplate] - Optional custom email template HTML
 */

/**
 * Generate email content from template and parameters
 * @param {EmailTemplateParams} params - Email parameters
 * @returns {Promise<{subject: string, html: string}>} Email content
 */
async function generateEmailContent(params) {
  // Get the template from database or use custom if provided
  let subject, html;
  
  if (params.customSubject && params.customTemplate) {
    // Use custom template if provided
    subject = params.customSubject;
    html = params.customTemplate;
  } else {
    // Get template from database
    const template = await getTemplate();
    
    if (!template) {
      console.warn('⚠️ No template found in database, using default from config');
      // Fallback to config file template
      subject = emailConfig.templates.jobApplication.subject;
      html = emailConfig.templates.jobApplication.body;
    } else {
      subject = template.subject;
      html = template.body;
    }
  }
  
  // Replace placeholders in the subject
  subject = subject
    .replace(/\[Job Title\]/g, params.jobTitle || '')
    .replace(/\[Company Name\]/g, params.companyName || '')
    .replace(/\[Application Date\]/g, params.applicationDate || '')
    .replace(/{{jobId}}/g, params.jobId || '')
    .replace(/\[Recipient\]/g, params.recipientName || '');
  
  // Replace placeholders with actual values
  html = html
    .replace(/\[Job Title\]/g, params.jobTitle || '')
    .replace(/\[Company Name\]/g, params.companyName || '')
    .replace(/\[Application Date\]/g, params.applicationDate || '')
    .replace(/{{jobId}}/g, params.jobId || '')
    .replace(/\[Recipient\]/g, params.recipientName || '');
  
  return { subject, html };
}

/**
 * Prepare a resume attachment if a PDF exists in the resume folder
 * @returns {Object|null} Attachment object for nodemailer or null
 */
function prepareResumeAttachment() {
  const resumeDir = path.join(__dirname, '../utils/resume');

  // Read all files in the resume directory
  const files = fs.readdirSync(resumeDir);

  // Look for the first PDF file
  const pdfFile = files.find(file => path.extname(file).toLowerCase() === '.pdf');

  if (!pdfFile) {
    console.warn('⚠️ No PDF resume found in resume folder');
    return null;
  }

  const fullPath = path.join(resumeDir, pdfFile);

  // Always use "Yogesh_Siwan_Resume.pdf" as the filename regardless of the actual file name
  return {
    filename: 'Yogesh_Siwan_Resume.pdf',
    path: fullPath,
    contentType: 'application/pdf'
  };
}

/**
 * Send an email to a recipient
 * @param {EmailTemplateParams} params - Email parameters
 * @returns {Promise<boolean>} Success or failure
 */
async function sendEmail(params) {
  try {
    const { subject, html } = await generateEmailContent(params);
    
    // Create email options
    const mailOptions = {
      from: `"${emailConfig.sender.name}" <${emailConfig.sender.email}>`,
      to: params.recipientEmail,
      subject,
      html
    };
    
    // Add resume attachment if available
    const attachment = prepareResumeAttachment();
      
    if (attachment) {
      mailOptions.attachments = [attachment];
      console.log(`📄 Resume "${attachment.filename}" attached to email`);
    }
    
    // Send mail with defined transport object
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${params.recipientEmail}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return false;
  }
}

/**
 * Validate the email configuration
 * @returns {Promise<boolean>} True if configuration is valid
 */
async function validateEmailConfig() {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}

module.exports = {
  sendEmail,
  validateEmailConfig,
  generateEmailContent
}; 