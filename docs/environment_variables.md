# Environment Variables

This document provides a comprehensive list of all environment variables used across the edge functions in this repository. It serves as a reference for configuring your development and production environments.

## Required Environment Variables

These variables are required for the core functionality of the edge functions:

| Variable | Description | Used By |
|----------|-------------|---------|
| `SUPABASE_URL` | URL of your Supabase project | All functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin access to Supabase | All functions |
| `SUPABASE_PROJECT_ID` | ID of your Supabase project | edge_deployment |
| `SUPABASE_JWT_SECRET` | Secret key for JWT token generation and validation | Authentication services |
| `MCP_SECRET_KEY` | Secret key for MCP server authentication | mcp-server |

## Agent Functions

Environment variables used by agent functions (agent_alpha, agent_beta, agent_stream, agent_websocket, agentic_inbox_agent):

| Variable | Description | Used By |
|----------|-------------|---------|
| `OPENROUTER_API_KEY` | API key for OpenRouter LLM access | All agent functions |
| `OPENROUTER_MODEL` | Model to use for LLM requests (e.g., openai/o3-mini-high) | All agent functions |
| `AGENT_NAME` | Name identifier for the agent | All agent functions |

## Management Functions

Environment variables used by management functions (agent-manager, edge_deployment):

| Variable | Description | Used By |
|----------|-------------|---------|
| `RECIPIENT` | Recipient for agent-manager messages | agent-manager |
| `MESSAGE` | Test message for agent-manager | agent-manager/send-message.ts |
| `POSTGRES_PASSWORD` | Password for PostgreSQL database (no default) | Database services |
| `SUPABASE_SERVICE_KEY` | Alternative name for service role key | edge_deployment |
| `SB_URL` | Alternative name for Supabase URL | edge_deployment |
| `SB_SERVICE_KEY` | Alternative name for service key | edge_deployment |
| `SB_ACCESS_KEY` | Access key for Supabase | meta-function-generator |
| `SB_ACCESS_TOKEN` | Access token for Supabase | test-function |

## Communication Functions

Environment variables used by communication functions (resend, send-contact-notification):

| Variable | Description | Used By |
|----------|-------------|---------|
| `RESEND_API_KEY` | API key for Resend email service | resend, send-contact-notification |
| `DEFAULT_RECIPIENT` | Default email recipient | resend |
| `NOTIFICATION_FROM_EMAIL` | Sender email for notifications | resend |
| `FEEDBACK_FROM_EMAIL` | Sender email for feedback | resend |
| `FEEDBACK_REPLY_TO_DOMAIN` | Reply-to domain for feedback emails | resend |
| `FROM_EMAIL` | Sender email address | send-contact-notification |

## Integration Functions

Environment variables used by integration functions (github-api, mcp-server, stripe functions):

| Variable | Description | Used By |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub API token | github-api |
| `GITHUB_ORG` | GitHub organization name | github-api |
| `GITHUB_WEBHOOK_SECRET` | Secret for GitHub webhook verification | github-api |
| `STRIPE_SECRET_KEY` | Secret key for Stripe API | stripe_check-subscription-status, stripe_create-portal-session |
| `DEFAULT_RETURN_URL` | Default return URL for Stripe portal | stripe_create-portal-session |
| `DEFAULT_TEST_EMAIL` | Test email for Stripe functions | stripe_create-portal-session |
| `DEFAULT_TEST_NAME` | Test customer name for Stripe | stripe_create-portal-session |

## Utility Functions

Environment variables used by utility functions:

| Variable | Description | Used By |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed origin for CORS | _shared/cors.ts |
| `VARIABLE_NAME` | Example variable for testing | test-function |
| `API_URL` | Alternative name for Supabase URL | Various functions |
| `SERVICE_KEY` | Alternative name for service key | Various functions |
| `USER_PASSWORD` | User password for authentication examples | Authentication examples |

## Client-Side Variables

These variables are prefixed with `VITE_` for use in client-side code:

| Variable | Description | Used By |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | Client-side Supabase URL | Client applications |
| `VITE_SUPABASE_ANON_KEY` | Client-side anonymous key | Client applications |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Client-side service role key | Client applications |
| `VITE_SUPABASE_PROJECT_ID` | Client-side project ID | Client applications |
| `VITE_OPENROUTER_API_KEY` | Client-side OpenRouter API key | Client applications |
| `VITE_OPENROUTER_MODEL` | Client-side OpenRouter model | Client applications |

## Environment Configuration

### Local Development

For local development, create a `.env` file in the root directory with the required variables:

```bash
# Required variables
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id
SUPABASE_JWT_SECRET=your-jwt-secret
POSTGRES_PASSWORD=your-secure-postgres-password
MCP_SECRET_KEY=your-mcp-secret-key

# Function-specific variables
OPENROUTER_API_KEY=your-openrouter-api-key
RESEND_API_KEY=your-resend-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
# ... other variables as needed
```

### Deployment

For deployment, set environment variables using the Supabase CLI:

```bash
# Set a single environment variable
supabase secrets set MY_API_KEY=your-api-key

# Set multiple environment variables
supabase secrets set MY_API_KEY=your-api-key OTHER_SECRET=another-secret

# Set environment variables from a .env file
supabase secrets set --env-file .env
```

### Environment-Specific Configuration

For different environments (development, staging, production), create separate `.env` files:

```
.env.development
.env.staging
.env.production
```

Then use the appropriate file when deploying:

```bash
supabase functions deploy function-name --env-file .env.production
```

## Testing Environment Variables

You can use the `env_test` utility to verify that your environment variables are correctly configured:

```bash
# Run the environment test
deno run --allow-env supabase/functions/env_test.ts

# Check specific variables
deno run --allow-env supabase/functions/env_test.ts OPENROUTER_API_KEY SUPABASE_URL

# Use the provided shell script
./supabase/functions/run-env-test.sh
```

## Best Practices

1. **Never hardcode secrets** in your source code. Always use environment variables.
2. **Never use default values for sensitive environment variables** in Docker Compose files or other configuration files.
3. **Validate required variables** at the start of your function:
   ```typescript
   const apiKey = Deno.env.get("API_KEY");
   if (!apiKey) {
     throw new Error("API_KEY environment variable is required");
   }
   ```
4. **Use different secrets** for development, staging, and production environments.
5. **Mask sensitive values** when logging or displaying them:
   ```typescript
   const maskedKey = apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4);
   console.log(`Using API key: ${maskedKey}`);
   ```
6. **Restrict access** to functions that expose environment variable information.

## Related Documentation

- [Secrets Management](./secrets_management.md) - Detailed guide on managing secrets and environment variables
- [Deployment Guide](./deployment.md) - Guide to deploying edge functions with environment variables
- [Deno Environment Variables Documentation](https://deno.land/manual/runtime/environment_variables)