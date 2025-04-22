/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date in YYYY-MM-DD format
 */
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
}

/**
 * Format a collection name for a specific date
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {string} Formatted collection name
 */
function formatDateToCollectionName(date) {
  return `job_applications_${date}`;
}

/**
 * Check if a date string is valid YYYY-MM-DD format
 * @param {string} dateString - Date string to validate
 * @returns {boolean} True if valid
 */
function isValidDateFormat(dateString) {
  // Check if it matches YYYY-MM-DD pattern
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) return false;
  
  // Check if the date is valid (e.g., not 2022-13-45)
  const date = new Date(dateString);
  const timestamp = date.getTime();
  if (isNaN(timestamp)) return false;
  
  return date.toISOString().slice(0, 10) === dateString;
}

module.exports = {
  getTodayDateString,
  formatDateToCollectionName,
  isValidDateFormat
}; 