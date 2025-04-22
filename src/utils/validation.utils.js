/**
 * Email validation utility
 * @param {string|null} input - Email to validate
 * @returns {boolean} True if valid email
 */
function isEmail(input) {
  if (!input) return false;
  
  // Regular expression for validating email
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(input);
}

/**
 * Phone number validation utility
 * @param {string|null} input - Phone number to validate
 * @returns {boolean} True if valid phone number
 */
function isPhoneNumber(input) {
  if (!input) return false;
  
  // Regular expressions for various phone number formats
  const phonePatterns = [
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,  // 555-555-5555, 555.555.5555, 555 555 5555
    /\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b/,   // (555) 555-5555, (555)555-5555
    /\b\+\d{1,3}[-.\s]?\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/  // +1 555-555-5555, +91 555-555-5555
  ];
  
  return phonePatterns.some(pattern => pattern.test(input));
}

/**
 * Validate cron schedule expression
 * @param {string} cronExpression - Cron schedule expression
 * @returns {boolean} True if valid cron expression
 */
function isValidCronExpression(cronExpression) {
  if (!cronExpression) return false;
  
  // Very basic validation, library will do more thorough validation
  const parts = cronExpression.trim().split(/\s+/);
  return parts.length === 5;
}

module.exports = {
  isEmail,
  isPhoneNumber,
  isValidCronExpression
}; 