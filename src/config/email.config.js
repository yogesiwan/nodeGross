require('dotenv').config();

module.exports = {
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    }
  },
  sender: {
    name: process.env.SENDER_NAME,
    email: process.env.FROM_EMAIL || '',
  },
  templates: {
    jobApplication: {
      subject: 'Application for [Job Title] position at [Company Name]',
      body: `>
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <h1>Job Application: [Job Title] at [Company Name]</h1>
    <p>Application ID: {{jobId}}</p>
    <p>Applied on: [Application Date]</p>
    <p>This is a basic template. You can edit it in the Cron Configuration page.</p>
  </div>
</body>
</html>`
    }
  }
}; 