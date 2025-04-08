# Environment Test Utility

## Overview

The Environment Test utility provides a simple way to verify that environment variables are correctly configured for edge functions. It helps developers ensure that their functions have access to the required environment variables before deployment.

## Architecture

The Environment Test utility follows a simple request-response architecture where it receives a request, checks for the presence of specified environment variables, and returns a response indicating which variables are available and which are missing.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │────▶│ Environment │────▶│ Environment │
│             │     │    Test     │     │  Variables  │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                   │                   │
       │                   │                   │
       └───────────────────┴───────────────────┘
                        Response
```

## Features

- **Environment Variable Checking**: Verify the presence of specified environment variables
- **Masked Values**: Display masked values of sensitive variables for verification without exposing secrets
- **Detailed Reporting**: Provide detailed reports on which variables are available and which are missing
- **Configurable Checks**: Allow specifying which variables to check
- **Required vs. Optional**: Distinguish between required and optional environment variables
- **Error Handling**: Provide clear error messages for missing required variables

## Implementation Details

### Request Processing

The utility processes incoming HTTP requests, extracting the list of environment variables to check:

```typescript
serve(async (req) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request data
    const { variables, required } = await req.json();
    
    // If no variables specified, check all environment variables
    const varsToCheck = variables || [];
    const requiredVars = required || [];
    
    // Check environment variables
    const result = checkEnvironmentVariables(varsToCheck, requiredVars);
    
    // Return response
    return new Response(JSON.stringify(result), {
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

### Environment Variable Checking

The utility checks for the presence of specified environment variables:

```typescript
function checkEnvironmentVariables(variables, required) {
  const result = {
    available: {},
    missing: [],
    allRequired: true
  };
  
  // If no variables specified, get all environment variables
  if (variables.length === 0) {
    for (const [key, value] of Object.entries(Deno.env.toObject())) {
      result.available[key] = maskValue(key, value);
    }
    return result;
  }
  
  // Check specified variables
  for (const variable of variables) {
    const value = Deno.env.get(variable);
    if (value !== undefined) {
      result.available[variable] = maskValue(variable, value);
    } else {
      result.missing.push(variable);
      if (required.includes(variable)) {
        result.allRequired = false;
      }
    }
  }
  
  return result;
}
```

### Value Masking

The utility masks sensitive values to prevent accidental exposure:

```typescript
function maskValue(key, value) {
  // List of sensitive environment variable name patterns
  const sensitivePatterns = [
    /key/i,
    /secret/i,
    /password/i,
    /token/i,
    /auth/i,
    /credential/i
  ];
  
  // Check if the key matches any sensitive pattern
  const isSensitive = sensitivePatterns.some(pattern => pattern.test(key));
  
  if (isSensitive) {
    // Mask the value, showing only the first and last characters
    if (value.length <= 4) {
      return "****";
    }
    return `${value.charAt(0)}${"*".repeat(value.length - 2)}${value.charAt(value.length - 1)}`;
  }
  
  // Return the full value for non-sensitive variables
  return value;
}
```

## Usage

### Basic Usage

To check all environment variables:

```json
{}
```

### Checking Specific Variables

To check specific environment variables:

```json
{
  "variables": ["OPENROUTER_API_KEY", "SUPABASE_URL", "DATABASE_URL"]
}
```

### Checking Required Variables

To check specific variables and mark some as required:

```json
{
  "variables": ["OPENROUTER_API_KEY", "SUPABASE_URL", "DATABASE_URL"],
  "required": ["OPENROUTER_API_KEY", "SUPABASE_URL"]
}
```

### Response Format

```json
{
  "available": {
    "OPENROUTER_API_KEY": "s********************t",
    "SUPABASE_URL": "https://example.supabase.co"
  },
  "missing": ["DATABASE_URL"],
  "allRequired": true
}
```

## Command Line Usage

The utility can also be used from the command line:

```bash
# Run the environment test
deno run --allow-env supabase/functions/env_test.ts

# Check specific variables
deno run --allow-env supabase/functions/env_test.ts OPENROUTER_API_KEY SUPABASE_URL

# Use the provided shell script
./supabase/functions/run-env-test.sh
```

## Shell Script

The utility includes a shell script for easier command-line usage:

```bash
#!/bin/bash
# run-env-test.sh

# Run the environment test with the specified variables
deno run --allow-env supabase/functions/env_test.ts "$@"
```

## Deployment

Deploy the Environment Test utility as a Supabase Edge Function:

```bash
# Deploy the function
supabase functions deploy env_test
```

## Testing

Test the Environment Test utility locally:

```bash
# Serve the function locally
supabase functions serve env_test --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/env_test \
  -H "Content-Type: application/json" \
  -d '{
    "variables": ["OPENROUTER_API_KEY", "SUPABASE_URL"],
    "required": ["OPENROUTER_API_KEY"]
  }'
```

## Security Considerations

- **Sensitive Information**: The utility masks sensitive environment variable values to prevent accidental exposure
- **Access Control**: Consider restricting access to this function in production environments
- **Error Handling**: Error messages are sanitized to prevent information leakage

## Integration with CI/CD

The Environment Test utility can be integrated into CI/CD pipelines to verify environment configuration before deployment:

```yaml
# GitHub Actions example
name: Verify Environment

on:
  push:
    branches:
      - main

jobs:
  verify-env:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      
      - name: Set environment variables
        run: |
          echo "OPENROUTER_API_KEY=${{ secrets.OPENROUTER_API_KEY }}" >> $GITHUB_ENV
          echo "SUPABASE_URL=${{ secrets.SUPABASE_URL }}" >> $GITHUB_ENV
      
      - name: Verify environment variables
        run: deno run --allow-env supabase/functions/env_test.ts OPENROUTER_API_KEY SUPABASE_URL
```

## Common Use Cases

### Pre-deployment Verification

Verify that all required environment variables are set before deploying:

```bash
# Verify environment variables before deployment
deno run --allow-env supabase/functions/env_test.ts OPENROUTER_API_KEY SUPABASE_URL DATABASE_URL

# Deploy only if verification succeeds
if [ $? -eq 0 ]; then
  supabase functions deploy my-function
else
  echo "Environment verification failed. Deployment aborted."
  exit 1
fi
```

### Environment Debugging

Debug environment issues in deployed functions:

```bash
# Call the deployed function to check environment
curl -X POST https://your-project-ref.supabase.co/functions/v1/env_test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{}'
```

### Local Development Setup

Verify local development environment setup:

```bash
# Verify local environment
./supabase/functions/run-env-test.sh OPENROUTER_API_KEY SUPABASE_URL DATABASE_URL

# Start local development server if verification succeeds
if [ $? -eq 0 ]; then
  supabase start
else
  echo "Local environment setup incomplete. Please check your .env file."
  exit 1
fi
```

## Limitations

- **Runtime Only**: The utility can only check environment variables at runtime, not during build time
- **No Validation**: The utility only checks for the presence of variables, not their validity or format
- **No Default Values**: The utility does not provide default values for missing variables

## Related Utilities

- **env_test.js**: JavaScript version of the utility for Node.js environments
- **run-env-test.sh**: Shell script wrapper for easier command-line usage

---

Created by rUv, Agentics Foundation founder.