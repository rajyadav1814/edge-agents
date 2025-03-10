# Resend Email Function

## Overview

The Resend function provides email communication capabilities using the Resend API. It allows sending transactional emails, notifications, and other email communications from edge functions.

## Architecture

The Resend function follows a simple request-response architecture where it receives an email request, processes it using the Resend API, and returns a response indicating success or failure.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │────▶│   Resend    │────▶│  Resend API │
│             │     │  Function   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                   │                   │
       │                   │                   │
       └───────────────────┴───────────────────┘
                        Response
```

## Features

- **Email Sending**: Send emails to one or multiple recipients
- **HTML Content**: Support for HTML email content
- **Plain Text Fallback**: Automatic plain text fallback for HTML emails
- **Attachments**: Support for file attachments
- **Templates**: Support for email templates
- **Reply-To**: Configurable reply-to address
- **Error Handling**: Robust error handling for API failures and invalid inputs
- **CORS Support**: Cross-Origin Resource Sharing support for web clients

## Implementation Details

### Request Processing

The function processes incoming HTTP requests, extracting the necessary information for sending emails:

```typescript
serve(async (req) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request data
    const { recipient, subject, html } = await req.json();
    
    // Validate inputs
    if (!recipient || !subject || !html) {
      throw new Error("Missing required fields: recipient, subject, html");
    }
    
    // Send email
    const response = await sendEmail(recipient, subject, html);
    
    // Return response
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle errors
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

### Email Sending

The function sends emails using the Resend API:

```typescript
async function sendEmail(recipient, subject, html) {
  // Get API key from environment variables
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  
  // Call Resend API
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`
    },
    body: JSON.stringify({
      from: "Agentic Inbox <notifications@agentics.org>",
      to: [recipient],
      subject: subject,
      html: html
    })
  });
  
  // Process response
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Resend API error: ${error.message || response.statusText}`);
  }
  
  return await response.json();
}
```

### Feedback Email Sending

The function also supports sending feedback emails with a different sender address:

```typescript
async function sendFeedbackEmail(recipient, subject, html, feedbackToken) {
  // Get API key from environment variables
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY environment variable is required");
  }
  
  // Call Resend API
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${resendApiKey}`
    },
    body: JSON.stringify({
      from: "Agentic Inbox <feedback@agentics.org>",
      to: [recipient],
      subject: subject,
      html: html,
      reply_to: `feedback+${feedbackToken}@agentics.org`
    })
  });
  
  // Process response
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Resend API error: ${error.message || response.statusText}`);
  }
  
  return await response.json();
}
```

## Configuration

The Resend function can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | API key for Resend | Required |

## Usage

### Standard Email Request Format

```json
{
  "recipient": "user@example.com",
  "subject": "Hello from Agentic Edge Functions",
  "html": "<h1>Hello!</h1><p>This is a test email.</p>"
}
```

### Feedback Email Request Format

```json
{
  "recipient": "user@example.com",
  "subject": "Feedback from Agentic Edge Functions",
  "html": "<h1>Feedback</h1><p>This is a feedback email.</p>",
  "feedbackToken": "abc123"
}
```

### Response Format

Success:
```json
{
  "id": "email-id",
  "from": "Agentic Inbox <notifications@agentics.org>",
  "to": ["user@example.com"],
  "created_at": "2023-01-01T00:00:00.000Z"
}
```

Error:
```json
{
  "error": "Error message"
}
```

## Error Handling

The function handles various error scenarios:

- **Invalid Input**: Returns a 400 error if the input format is invalid
- **API Errors**: Returns a 500 error with details if the Resend API fails
- **Missing API Key**: Returns a 500 error if the RESEND_API_KEY environment variable is not set
- **Network Errors**: Returns a 500 error if there are network issues

## Deployment

Deploy the Resend function as a Supabase Edge Function:

```bash
# Deploy the function
supabase functions deploy resend

# Set environment variables
supabase secrets set RESEND_API_KEY=your-resend-api-key
```

## Testing

Test the Resend function locally:

```bash
# Serve the function locally
supabase functions serve resend --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/resend \
  -H "Content-Type: application/json" \
  -d '{
    "recipient": "user@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello!</h1><p>This is a test email.</p>"
  }'
```

## Security Considerations

- **API Key Protection**: The Resend API key is stored as an environment variable and never exposed to clients
- **Input Validation**: All inputs are validated to prevent injection attacks
- **Error Handling**: Error messages are sanitized to prevent information leakage
- **Rate Limiting**: Consider implementing rate limiting to prevent abuse

## Limitations

- **API Dependency**: Requires a connection to the Resend API
- **Rate Limiting**: Subject to Resend API rate limits
- **Cost**: Usage of the Resend API may incur costs
- **Sender Addresses**: Limited to predefined sender addresses

## Integration with Other Functions

The Resend function can be integrated with other edge functions to provide email capabilities:

```typescript
// Example of calling the Resend function from another function
async function sendNotificationEmail(user, message) {
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/resend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      recipient: user.email,
      subject: "New Notification",
      html: `<h1>New Notification</h1><p>${message}</p>`
    })
  });
  
  return await response.json();
}
```

---

Created by rUv, Agentics Foundation founder.