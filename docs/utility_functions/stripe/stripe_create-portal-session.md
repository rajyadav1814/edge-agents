# Stripe Create Portal Session Function

The `stripe_create-portal-session` function is a Supabase Edge Function that creates Stripe customer portal sessions.

## Overview

This function allows applications to create Stripe customer portal sessions for users to manage their subscriptions, payment methods, and billing information. It provides a secure way to generate portal URLs without exposing Stripe API keys to the client.

## Features

- Create Stripe customer portal sessions
- Handle customer lookup by email
- Support for test mode vs. production mode
- Automatic portal configuration creation
- CORS support for cross-origin requests

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Required |
| `DEFAULT_RETURN_URL` | URL to redirect users after they leave the portal | `https://example.com/dashboard/membership` |
| `DEFAULT_TEST_EMAIL` | Email to use for test customers | `test@example.com` |
| `DEFAULT_TEST_NAME` | Name to use for test customers | `Test Customer` |

## API Usage

### Endpoint

```
POST /functions/v1/stripe_create-portal-session
```

### Request Format

```json
{
  "customerId": "cus_12345abcdef",
  "returnUrl": "https://example.com/account",
  "userEmail": "user@example.com"
}
```

### Response Format

```json
{
  "url": "https://billing.stripe.com/session/live_12345abcdef"
}
```

## Error Handling

The function returns appropriate HTTP status codes and error messages for various failure scenarios:

- `400 Bad Request`: Missing customer ID or invalid parameters
- `404 Not Found`: Customer not found in Stripe
- `405 Method Not Allowed`: Request method other than POST
- `500 Internal Server Error`: Server-side errors or Stripe API issues

## Special Features

- If a customer ID is not found, the function can look up the customer by email
- In test mode, if a customer doesn't exist, a test customer can be created automatically
- The function can create a portal configuration if one doesn't exist

## Security Considerations

- Uses Stripe API key securely on the server side
- Validates customer ID format
- Handles CORS for secure cross-origin requests