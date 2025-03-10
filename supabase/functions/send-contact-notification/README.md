# Contact Form Notification Edge Function

This Supabase Edge Function sends email notifications and stores contact information in the database when users submit the contact form on the Agentics website.

## Overview

The function performs two main tasks:
1. Sends email notifications to specified recipients using the Resend API
2. Stores the contact information in the Supabase contacts table for CRM purposes

## Configuration

The function requires the following environment variables:

- `RESEND_API_KEY`: Your Resend API key
- `FROM_EMAIL`: The email address to send from (defaults to contact@agentics.org if not set)
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key for authentication
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key for database operations

### Database Setup

The function stores contact form submissions in a `contacts` table in your Supabase database. To set up this table, run:

```bash
./scripts/supabase/setup-contacts-table.sh
```

This script will:
1. Create the `contacts` table with appropriate indexes
2. Set up security policies for the table
3. Create a `save_contact_form` function for storing contact information
4. Optionally test the contact form functionality

## Deployment

Use one of the provided deployment scripts to deploy the function and set up the required environment variables:

### If you already have Supabase CLI installed:

```bash
./scripts/supabase/deploy-contact-function.sh
```

### If you don't have Supabase CLI installed:

```bash
./scripts/supabase/install-cli-and-deploy.sh
```

These scripts will:
1. Install the Supabase CLI if needed (install-cli-and-deploy.sh only)
2. Check if you're logged in to Supabase and prompt you to log in if needed
3. Deploy the function to your Supabase project
4. Set the required environment variables using the values from your `.env` file

### Supabase Authentication

To deploy the function, you need to be authenticated with Supabase. You can either:

1. Log in interactively when prompted by the script:
   ```bash
   supabase login
   ```

2. Set the `SUPABASE_ACCESS_TOKEN` environment variable:
   ```bash
   export SUPABASE_ACCESS_TOKEN=your_access_token
   ```

You can generate an access token at https://supabase.com/dashboard/account/tokens

## Testing

You can test the function using the provided test script:

```bash
./scripts/supabase/test-contact-function.sh
```

This script will send a test email to ruv@ruv.net using the Edge Function.

## API

### Request Format

```json
{
  "recipients": ["email1@example.com", "email2@example.com"],
  "subject": "Email Subject",
  "formData": {
    "name": "User Name",
    "email": "user@example.com",
    "interests": "User Interests"
  }
}
```

### Response Format

```json
{
  "success": true,
  "recipients": ["email1@example.com", "email2@example.com"],
  "contactSaved": true,
  "contactId": "123e4567-e89b-12d3-a456-426614174000"
}
```

The `contactSaved` field indicates whether the contact information was successfully saved to the database, and `contactId` contains the UUID of the newly created contact record.

## Client Integration

The function is integrated with the client-side application through the `contactService.js` file, which handles form submissions and calls the Edge Function.
