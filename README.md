# NodeGross - Dedicated Cron Job Server

A dedicated Node.js server for managing and executing cron jobs for the job application tracking system. This server handles automated email notifications for job applications based on scheduled tasks.

## Features

- RESTful API for managing cron jobs
- MongoDB persistence for cron configurations
- Email sending capabilities with templates
- Schedule management with node-cron
- Automatic initialization of active jobs on server restart

## Getting Started

### Prerequisites

- Node.js 14+ installed
- MongoDB instance available
- SMTP server access for sending emails

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Configure environment variables by copying `.env.example` to `.env` and updating the values:
   ```
   cp .env.example .env
   ```
4. Update the MongoDB connection string, SMTP settings, and other configurations in the `.env` file

### Running the Server

For development with auto-reload:
```
npm run dev
```

For production:
```
npm start
```

## API Endpoints

### Cron Job Management

- **GET /api/cron/status**
  - Get the current status of scheduled cron jobs

- **POST /api/cron/schedule**
  - Schedule a new cron job
  - Body: `{ "schedule": "30 23 * * *" }`

- **POST /api/cron/stop**
  - Stop the currently running cron job

- **POST /api/cron/run-now**
  - Run the email job immediately

- **POST /api/cron/initialize**
  - Initialize cron jobs from database

- **POST /api/cron/test-email**
  - Send a test email
  - Body: `{ "email": "recipient@example.com" }`

- **POST /api/cron/update-template**
  - Update the email template
  - Body: 
    ```json
    {
      "subject": "Job Application Follow-up for [Job Title]",
      "body": "<p>Dear [Recipient],</p><p>Thank you for considering my application.</p>"
    }
    ```

## Cron Schedule Format

The cron schedule format follows the standard crontab format:

```
* * * * *
│ │ │ │ │
│ │ │ │ └── Day of week (0-7, where 0 and 7 are Sunday)
│ │ │ └──── Month (1-12)
│ │ └────── Day of month (1-31)
│ └──────── Hour (0-23)
└────────── Minute (0-59)
```

Examples:
- `30 23 * * *` - Every day at 11:30 PM
- `0 8 * * 1-5` - Every weekday at 8:00 AM
- `0 0 1 * *` - At midnight on the first day of each month

## Email Templates

The cron server supports a customizable email template with placeholder variables that are replaced with actual values when emails are sent.

### Available Placeholders

The following placeholders can be used in both the subject and body of the email template:

- `[Job Title]` - The job title from the application
- `[Company Name]` - The company name from the application
- `[Application Date]` - The date the application was submitted
- `[Recipient]` - The recipient's name (if available)
- `{{jobId}}` - The unique job ID

### Resume Attachments

The system automatically attaches resumes to emails when available. Resumes are retrieved from:

1. The job application record
2. A separate `resumes` collection that contains resume data linked to job IDs

The system supports various resume formats including:
- PDF documents
- Word documents
- Base64-encoded files

## Architecture

- **Config**: Configuration files for database, email, and server settings
- **Controllers**: HTTP request handlers
- **DB**: Database connection and utilities
- **Models**: Data models and schemas
- **Routes**: API route definitions
- **Services**: Business logic
- **Utils**: Utility functions

## Integration with Main Application

This server is designed to run independently from the main application. The main application should communicate with this server via HTTP requests to manage cron jobs. 