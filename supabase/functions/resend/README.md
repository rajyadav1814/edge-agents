# Resend Email Function

## Overview

The Resend function provides email communication capabilities using the Resend API. It allows sending notifications and feedback requests from agents to users via email.

## Features

- **Email Notifications**: Send email notifications from agents to users
- **Feedback Requests**: Send emails requesting user feedback with interactive buttons
- **HTML Content**: Rich HTML email templates with styling
- **Database Logging**: Logs all notifications and feedback requests in the database
- **Error Handling**: Robust error handling for API failures and invalid inputs

## Implementation Details

### Request Format

The function accepts POST requests with the following JSON payload:

```json
{
  "agentName": "AgentName",         // Required: Name of the agent sending the message
  "message": "Message content",     // Required: Content of the message
  "recipient": "user@example.com",  // Optional: Email recipient (defaults to DEFAULT_RECIPIENT env var)
  "action": "notify"                // Optional: Action to take ("notify" or "request_feedback", defaults to "notify")
}
```

### Response Format

Success:
```json
{
  "success": true,
  "message": "Email notification sent successfully"
}
```

Error:
```json
{
  "success": false,
  "error": "Error message"
}
```

## Usage Examples

### Sending a Notification

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/resend' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "agentName": "AssistantBot",
    "message": "Your task has been completed successfully."
  }'
```

### Requesting Feedback

```bash
curl -X POST 'https://your-project-ref.supabase.co/functions/v1/resend' \
  -H 'Authorization: Bearer your-anon-key' \
  -H 'Content-Type: application/json' \
  -d '{
    "agentName": "AssistantBot",
    "message": "I've drafted an email to the client. Please review and provide feedback.",
    "recipient": "manager@example.com",
    "action": "request_feedback"
  }'
```

## Configuration

The Resend function can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `RESEND_API_KEY` | API key for Resend | Required |
| `DEFAULT_RECIPIENT` | Default email recipient | user@example.com |
| `NOTIFICATION_FROM_EMAIL` | Email address for notifications | notifications@agentics.org |
| `FEEDBACK_FROM_EMAIL` | Email address for feedback requests | feedback@agentics.org |
| `FEEDBACK_REPLY_TO_DOMAIN` | Domain for reply-to addresses | agentics.org |

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
    "agentName": "TestAgent",
    "message": "This is a test message"
  }'
```

## Integration with Other Functions

The Resend function can be integrated with other edge functions to provide email capabilities:

```typescript
// Example of calling the Resend function from another function
async function sendAgentNotification(agentName, message, recipient) {
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/resend", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      agentName,
      message,
      recipient,
      action: "notify"
    })
  });
  
  return await response.json();
}
```

## Security Considerations

- **API Key Protection**: The Resend API key is stored as an environment variable and never exposed to clients
- **Input Validation**: All inputs are validated to prevent injection attacks
- **Error Handling**: Error messages are sanitized to prevent information leakage

## Limitations

- **API Dependency**: Requires a connection to the Resend API
- **Rate Limiting**: Subject to Resend API rate limits
- **Cost**: Usage of the Resend API may incur costs
- **Sender Addresses**: Limited to predefined sender addresses
