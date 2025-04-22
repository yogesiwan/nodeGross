/**
 * Job Question schema
 * @typedef {Object} JobQuestion
 * @property {string} question - The question text
 * @property {string} answer - The answer text
 * @property {string} type - The question type
 * @property {string|null} previous_answer - Previous answer if any
 */

/**
 * Job schema
 * @typedef {Object} Job
 * @property {Object} [_id] - MongoDB ID
 * @property {string} job_id - Unique job identifier
 * @property {string} title - Job title
 * @property {string} company - Company name
 * @property {string} work_location - Work location
 * @property {string} work_style - Work style (remote, hybrid, on-site)
 * @property {string} description - Job description
 * @property {number} experience_required - Years of experience required
 * @property {string} skills - Skills required
 * @property {string} hr_name - HR contact name
 * @property {string} hr_link - HR contact link
 * @property {string} resume - Resume used
 * @property {boolean} reposted - Whether job was reposted
 * @property {string} date_listed - Date job was listed
 * @property {string} date_applied - Date applied for job
 * @property {string} job_link - Link to job
 * @property {string} application_link - Link to application
 * @property {Array<JobQuestion>} questions - Application questions
 * @property {string} connect_request - Connect request status
 * @property {number} grade - Job grade/score
 * @property {string} created_at - Creation timestamp
 * @property {string} [scraped_on] - Scrape timestamp
 * @property {string} [status] - Application status
 * @property {string} [updated_at] - Last update timestamp
 * @property {string} [evaluation] - Evaluation notes
 * @property {string} [send_to] - Email to send application to
 */

/**
 * Jobs by date schema
 * @typedef {Object} JobsByDate
 * @property {string} date - Date in YYYY-MM-DD format
 * @property {Array<Job>} jobs - Jobs for the date
 */

/**
 * Normalize MongoDB-specific types in a job object
 * @param {Object} job - Job object from MongoDB
 * @returns {Job} Normalized job object
 */
function normalizeJob(job) {
  // Convert MongoDB specific types to standard types
  return {
    ...job,
    // Handle $oid if present
    _id: job._id?.$oid ? { $oid: job._id.$oid } : job._id,
    // Convert experience_required if it's a $numberInt
    experience_required: job.experience_required?.$numberInt 
      ? parseInt(job.experience_required.$numberInt) 
      : job.experience_required,
    // Ensure grade is always a number <= 1000
    grade: typeof job.grade === 'number' 
      ? Math.min(job.grade, 1000) 
      : (job.grade?.$numberInt ? parseInt(job.grade.$numberInt) : 0)
  };
}

module.exports = {
  normalizeJob
}; 