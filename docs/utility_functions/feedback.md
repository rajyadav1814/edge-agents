# Feedback Function

The `feedback` function is a Supabase Edge Function that collects and processes user feedback.

## Overview

This function allows applications to collect feedback from users and store it in the database. It also supports sending email notifications about new feedback submissions.

## Features

- Collect user feedback from various sources
- Store feedback in the database
- Send email notifications about new feedback
- Support for different feedback types (bug reports, feature requests, general feedback)
- CORS support for cross-origin requests

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | API key for the Resend email service | Required |
| `FEEDBACK_FROM_EMAIL` | Email address to send notifications from | `feedback@example.com` |
| `FEEDBACK_REPLY_TO_DOMAIN` | Domain for reply-to email addresses | `example.com` |
| `NOTIFICATION_RECIPIENTS` | Comma-separated list of email addresses to notify | Required |

## API Usage

### Endpoint

```
POST /functions/v1/feedback
```

### Request Format

```json
{
  "type": "bug_report",
  "subject": "Error when submitting form",
  "message": "I encountered an error when trying to submit the contact form.",
  "metadata": {
    "browser": "Chrome 98.0.4758.102",
    "os": "Windows 10",
    "url": "https://example.com/contact"
  },
  "user": {
    "id": "user_12345",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Response Format

```json
{
  "success": true,
  "feedbackId": "feedback_12345",
  "notificationSent": true
}
```

## Error Handling

The function returns appropriate HTTP status codes and error messages for various failure scenarios:

- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid authentication
- `500 Internal Server Error`: Server-side errors

## Database Storage

Feedback is stored in the database with the following information:

- Feedback type, subject, and message
- User information (ID, email, name)
- Metadata (browser, OS, URL)
- Timestamp
- Status (new, in progress, resolved)

## Security Considerations

- Validates input data
- Sanitizes user input to prevent injection attacks
- Uses authentication to prevent spam