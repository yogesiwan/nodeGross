require('dotenv').config();

module.exports = {
  uri: process.env.MONGODB_URI,
  dbName: 'job_list',
  collections: {
    jobApplications: 'job_applications_'
  }
}; 