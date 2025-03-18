# Calendly Edge Function

This edge function provides an interface to the Calendly API v2, allowing for:
- User management
- Event type management
- Scheduled events management
- Invitee management
- Organization management
- Single-use scheduling link creation

## Setup

### 1. Initialize Supabase Project

Before you can deploy the function or set secrets, you need to initialize your Supabase project:

```bash
# Initialize Supabase (if not already done)
supabase init

# Link to your Supabase project
supabase link --project-ref your-project-ref
```

### 2. Set Supabase Secrets

Before using this function, you need to set up the required secrets for Calendly API authentication. Use the Supabase CLI to set these secrets:

```bash
# For Personal Access Token authentication (recommended for internal applications)
supabase secrets set CALENDLY_PERSONAL_ACCESS_TOKEN="your-personal-access-token"

# For OAuth 2.0 authentication (recommended for public applications)
supabase secrets set CALENDLY_OAUTH_CLIENT_ID="your-oauth-client-id"
supabase secrets set CALENDLY_OAUTH_CLIENT_SECRET="your-oauth-client-secret"
```

Replace the placeholder values with your actual Calendly API credentials.

### 3. Deploy the Function

Deploy the function to your Supabase project:

```bash
supabase functions deploy calendly
```

### Alternative: Local Development Only

If you're only developing locally and don't have a Supabase project set up yet, you can still run the function locally:

```bash
supabase start
```

## Authentication Methods

The Calendly edge function supports multiple authentication methods:

1. **Environment Variable**: Set the `CALENDLY_PERSONAL_ACCESS_TOKEN` environment variable.
2. **Authorization Header**: Pass the token in the standard Authorization header.
3. **Calendly-Auth Header**: Pass the Calendly token in a dedicated Calendly-Auth header.

The function prioritizes authentication methods in this order:
1. Calendly-Auth header (if present)
2. Authorization header (if present)
3. Environment variable (if set)

## Usage

### Get Current User

```bash
# Using Authorization header
curl -i --location --request GET 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/calendly/me' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json'

# Using Calendly-Auth header (recommended for direct Calendly API tokens)
curl -i --location --request GET 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/calendly/me' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'Calendly-Auth: YOUR_CALENDLY_PERSONAL_ACCESS_TOKEN'
```

To test the single-use scheduling link functionality locally:

```bash
curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/calendly/create-scheduling-link' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'Calendly-Auth: YOUR_CALENDLY_PERSONAL_ACCESS_TOKEN' \
  --data '{"eventTypeUri": "https://api.calendly.com/event_types/YOUR_EVENT_TYPE_ID"}'
```

### List Event Types

```bash
# Using Authorization header
curl -i --location --request GET 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/calendly/event-types?user=USER_URI' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json'

# Using Calendly-Auth header
curl -i --location --request GET 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/calendly/event-types?user=USER_URI' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'Calendly-Auth: YOUR_CALENDLY_PERSONAL_ACCESS_TOKEN'
```

### List Scheduled Events

```bash
curl -i --location --request GET 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/calendly/scheduled-events?user=USER_URI' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'Calendly-Auth: YOUR_CALENDLY_PERSONAL_ACCESS_TOKEN'
```

### Get Event Invitees

```bash
curl -i --location --request GET 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/calendly/invitees?event=EVENT_URI' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'Calendly-Auth: YOUR_CALENDLY_PERSONAL_ACCESS_TOKEN'
```

### Create Webhook

```bash
curl -i --location --request POST 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/calendly/create-webhook' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'Calendly-Auth: YOUR_CALENDLY_PERSONAL_ACCESS_TOKEN' \
  --data '{
    "webhookUrl": "https://your-webhook-url.com",
    "events": ["invitee.created", "invitee.canceled"],
    "scope": "user",
    "scopeUri": "USER_URI"
  }'
```

### Create Single-Use Scheduling Link

```bash
curl -i --location --request POST 'https://[YOUR_PROJECT_REF].supabase.co/functions/v1/calendly/create-scheduling-link' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'Calendly-Auth: YOUR_CALENDLY_PERSONAL_ACCESS_TOKEN' \
  --data '{
    "eventTypeUri": "https://api.calendly.com/event_types/YOUR_EVENT_TYPE_ID",
    "maxEventCount": 1
  }'
```

This creates a one-time use link that expires after someone books a meeting. The `maxEventCount` parameter defaults to 1 if not specified, making it a single-use link. This is particularly useful when you want to limit who can book time with you to avoid unwanted meetings.

## Local Development

To run the function locally with environment variables:

```bash
# Create a .env.local file with your credentials
echo "CALENDLY_PERSONAL_ACCESS_TOKEN=your-token-here" > .env.local

# Run the function with the environment file
supabase functions serve calendly --env-file .env.local
```

Note: The .env.local file should not be committed to version control. Add it to your .gitignore file.

Then you can test the function with:

```bash
# Using Authorization header
curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/calendly/me' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json'

# Using Calendly-Auth header
curl -i --location --request GET 'http://127.0.0.1:54321/functions/v1/calendly/me' \
  --header 'Authorization: Bearer YOUR_SUPABASE_TOKEN' \
  --header 'Content-Type: application/json' \
  --header 'Calendly-Auth: YOUR_CALENDLY_PERSONAL_ACCESS_TOKEN'