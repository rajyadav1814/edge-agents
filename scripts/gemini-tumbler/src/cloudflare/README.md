# Cloudflare Worker for Gemini Tumbler

This directory contains the implementation of a Cloudflare Worker that serves as an additional layer in the Gemini Tumbler's daisy-chain anonymization system.

## Overview

The Cloudflare Worker provides an additional layer of privacy by:

1. Running on Cloudflare's global edge network, separate from Supabase
2. Anonymizing IP addresses, user agents, and geolocation data
3. Forwarding anonymized data to the next service in the chain
4. Adding cross-platform separation to enhance privacy guarantees

## Files

- `cloudflare-worker.ts`: Main Worker implementation
- `cloudflare-worker.test.ts`: Tests for the Worker
- `wrangler.toml`: Configuration for Cloudflare Workers
- `package.json`: Node.js dependencies
- `tsconfig.json`: TypeScript configuration
- `deploy-cloudflare-worker.sh`: Deployment script
- `test-cloudflare-worker.sh`: Test script

## Setup and Deployment

### Prerequisites

- Node.js and npm
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare account

### Configuration

1. Log in to Wrangler:
   ```
   wrangler login
   ```

2. Configure your secrets:
   ```
   wrangler secret put ANONYMIZER_SALT
   wrangler secret put AUTH_SECRET
   ```

3. Update `wrangler.toml` with your configuration:
   - Set `NEXT_SERVICE_URL` to point to the next service in your chain

### Deployment

Run the deployment script:
```
./deploy-cloudflare-worker.sh
```

Or deploy manually:
```
npm install
wrangler publish
```

## Testing

Run the test script:
```
./test-cloudflare-worker.sh
```

Or run tests manually:
```
deno test --allow-net --allow-env cloudflare-worker.test.ts
```

## Integration with Supabase Edge Functions

To integrate this Cloudflare Worker into your existing Gemini Tumbler daisy chain:

1. Deploy the Cloudflare Worker
2. Note the Worker's URL (e.g., `https://gemini-tumbler-worker.your-name.workers.dev`)
3. Update your Supabase Edge Function's environment variable:
   - Set `NEXT_FUNCTION_ENDPOINT` to your Worker's URL in the function that should forward to Cloudflare

## Environment Variables

- `ANONYMIZER_SALT`: Salt used for hashing (set as a secret)
- `ANONYMIZER_ENABLED`: Whether anonymization is enabled ("true" or "false")
- `ANONYMIZER_FIELDS`: JSON string configuring which fields to anonymize
- `NEXT_SERVICE_URL`: URL of the next service in the chain
- `AUTH_SECRET`: Secret for authentication (set as a secret)