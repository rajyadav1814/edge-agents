# Check Subscription Status Edge Function

This Edge Function checks the status of a Stripe subscription using an email address.

## Purpose

This function allows you to check if a user has an active subscription in Stripe without needing their Stripe customer ID. It's useful for:

- Verifying subscription status during authentication
- Checking access rights to premium content
- Displaying subscription information in user profiles
- Troubleshooting subscription issues

## Usage

Send a POST request to the function endpoint with the following parameters:

```json
{
  "userEmail": "user@example.com"
}
```

## Response

The function will return a JSON response with the subscription status and details:

```json
{
  "status": "active",
  "hasActiveSubscription": true,
  "subscriptionDetails": {
    "customerId": "cus_123456789",
    "subscriptionId": "sub_123456789",
    "plan": "premium",
    "currentPeriodEnd": "2023-12-31T23:59:59Z"
  }
}
```

If no subscription is found, it will return:

```json
{
  "status": "not_found",
  "hasActiveSubscription": false,
  "message": "No subscription found for this email"
}
```

## Error Handling

If an error occurs, the function will return an appropriate error message and status code.
