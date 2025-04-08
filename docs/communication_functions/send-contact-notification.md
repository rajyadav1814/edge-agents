# Send Contact Notification Function

The `send-contact-notification` function is a Supabase Edge Function that handles sending email notifications when users submit contact forms.

## Overview

This function processes contact form submissions and sends notification emails to specified recipients using the Resend API. It also stores the contact information in the database for future reference.

## Features

- Sends email notifications for contact form submissions
- Stores contact information in the database
- Validates input data
- Handles CORS for cross-origin requests
- Provides detailed error responses

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | API key for the Resend email service | Required |
| `FROM_EMAIL` | Email address to send notifications from | `contact@example.com` |
| `VITE_SUPABASE_URL` | Supabase project URL | Required |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for database operations | Required |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key for authentication | Required |

## API Usage

### Endpoint

```
POST /functions/v1/send-contact-notification
```

### Request Format

```json
{
  "recipients": ["admin@example.com"],
  "subject": "New Contact Form Submission",
  "formData": {
    "name": "John Doe",
    "email": "john@example.com",
    "interests": "Membership",
    "message": "I'd like to learn more about your services."
  }
}
```

### Response Format

```json
{
  "success": true,
  "recipients": ["admin@example.com"],
  "contactSaved": true,
  "contactId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Error Handling

The function returns appropriate HTTP status codes and error messages for various failure scenarios:

- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid authentication
- `500 Internal Server Error`: Server-side errors

## Security

- Requires authentication via the Supabase anon key
- Uses service role key for database operations
- Validates input data before processing