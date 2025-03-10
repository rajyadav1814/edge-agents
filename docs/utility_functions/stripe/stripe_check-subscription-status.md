# Stripe Check Subscription Status Function

The `stripe_check-subscription-status` function is a Supabase Edge Function that verifies the subscription status of users in Stripe.

## Overview

This function allows applications to check if a user has an active subscription in Stripe. It provides a secure way to verify subscription status without exposing Stripe API keys to the client.

## Features

- Verify subscription status for a given customer ID
- Check subscription tier and plan details
- Handle test mode vs. production mode
- Support for multiple subscription products
- CORS support for cross-origin requests

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe API secret key | Required |
| `STRIPE_WEBHOOK_SECRET` | Secret for verifying Stripe webhook events | Required |
| `SUBSCRIPTION_PRODUCT_ID` | ID of the subscription product in Stripe | Required |

## API Usage

### Endpoint

```
POST /functions/v1/stripe_check-subscription-status
```

### Request Format

```json
{
  "customerId": "cus_12345abcdef",
  "includeDetails": true
}
```

### Response Format

```json
{
  "active": true,
  "subscription": {
    "id": "sub_12345abcdef",
    "status": "active",
    "current_period_end": 1672531199,
    "plan": {
      "id": "price_12345abcdef",
      "product": "prod_12345abcdef",
      "nickname": "Premium Plan",
      "amount": 1999,
      "currency": "usd",
      "interval": "month"
    }
  }
}
```

## Error Handling

The function returns appropriate HTTP status codes and error messages for various failure scenarios:

- `400 Bad Request`: Missing customer ID or invalid parameters
- `404 Not Found`: Customer not found in Stripe
- `500 Internal Server Error`: Server-side errors or Stripe API issues

## Security Considerations

- Uses Stripe API key securely on the server side
- Validates input parameters
- Returns only necessary subscription information
- Handles CORS for secure cross-origin requests