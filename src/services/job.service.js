const { getCollection } = require('../db/connection');
const { isEmail } = require('../utils/validation.utils');
const { formatDateToCollectionName } = require('../utils/date.utils');
const { normalizeJob } = require('../models/Job');

/**
 * Find jobs with email addresses in the send_to field
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {Promise<Array>} Jobs with email addresses
 */
async function findJobsWithEmails(date) {
  try {
    const collectionName = formatDateToCollectionName(date);
    
    // Get the collection
    const collection = await getCollection(collectionName);
    
    // Check if collection exists
    if (!collection) {
      console.log(`Collection ${collectionName} does not exist`);
      return [];
    }
    
    // Find jobs with non-empty send_to field
    const jobs = await collection
      .find({ send_to: { $ne: null, $exists: true } })
      .toArray();
    
    console.log(`🔍 Found ${jobs.length} potential jobs with send_to fields for date ${date}`);
    
    // Convert MongoDB documents to Job objects and filter for emails
    const validJobs = jobs
      .map(normalizeJob)
      .filter(job => isEmail(job.send_to || null));
    
    console.log(`✉️ After filtering, found ${validJobs.length} jobs with valid email addresses`);
    
    return validJobs;
  } catch (error) {
    console.error(`❌ Error finding jobs with emails for date ${date}:`, error);
    return [];
  }
}


module.exports = {
  findJobsWithEmails
}; 