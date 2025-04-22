const { getCollection } = require('../db/connection');
const dbConfig = require('../config/db.config');

/**
 * Template schema
 * @typedef {Object} Template
 * @property {string} subject - Email subject template
 * @property {string} body - Email body template (HTML)
 * @property {string} updatedAt - Last update timestamp
 */

/**
 * Collection name for the template
 */
const TEMPLATE_COLLECTION = 'email_template';
const TEMPLATE_ID = 'job_application_template';

/**
 * Get the current email template
 * @returns {Promise<Template|null>} Template object or null
 */
async function getTemplate() {
  const collection = await getCollection(TEMPLATE_COLLECTION);
  return collection.findOne({ _id: TEMPLATE_ID });
}

/**
 * Update the email template
 * @param {Object} updates - Fields to update (subject and/or body)
 * @returns {Promise<Template|null>} Updated template or null
 */
async function updateTemplate(updates) {
  const collection = await getCollection(TEMPLATE_COLLECTION);
  
  const now = new Date().toISOString();
  const updatedTemplate = {
    ...updates,
    updatedAt: now
  };
  
  // Upsert the template (create if doesn't exist, update if it does)
  await collection.updateOne(
    { _id: TEMPLATE_ID },
    { $set: updatedTemplate },
    { upsert: true }
  );
  
  return getTemplate();
}

/**
 * Initialize default template if it doesn't exist
 * @returns {Promise<void>}
 */
async function initializeDefaultTemplate() {
  const template = await getTemplate();
  
  if (!template) {
    // Get the default template from the config
    const emailConfig = require('../config/email.config');
    const { subject, body } = emailConfig.templates.jobApplication;
    
    await updateTemplate({
      subject,
      body
    });
    
    console.log('🌱 Initialized default email template');
  }
}

module.exports = {
  getTemplate,
  updateTemplate,
  initializeDefaultTemplate
}; 