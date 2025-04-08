# Mastra AI Agent Setup Guide

This guide provides detailed instructions for setting up and configuring the Mastra AI agent Supabase Edge Function.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Deno](https://deno.land/) v1.30.0 or higher
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Git](https://git-scm.com/)

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd edge-agents
```

### 2. Navigate to the Mastra Function Directory

```bash
cd supabase/functions/mastra
```

### 3. Configure Environment Variables

The Mastra AI agent requires several environment variables to function properly. These variables control the agent's behavior, authentication, and external service integrations.

1. Create a local environment file:

```bash
cp .env.example .env
```

2. Open the `.env` file in your preferred text editor:

```bash
nano .env
```

3. Configure the following variables:

#### Agent Configuration

```
# Agent Configuration
AGENT_NAME=MastraAgent
AGENT_INSTRUCTIONS=You are a helpful assistant that provides information and assistance.
```

- `AGENT_NAME`: Sets the name of your AI agent
- `AGENT_INSTRUCTIONS`: Provides system instructions that guide the agent's behavior

#### Authentication

```
# Authentication
AUTH_TOKEN=your-secret-token
```

- `AUTH_TOKEN`: A secret token used to authenticate API requests
  - Use a strong, random string
  - Keep this value secret and never commit it to version control

#### API Keys

```
# API Keys
WEATHER_API_KEY=your-weather-api-key
# Add other API keys as needed
```

- `WEATHER_API_KEY`: API key for the weather service integration
  - Required only if you plan to use the weather tool
  - Can be obtained from a weather API provider

#### Supabase Configuration

```
# Supabase Configuration (if needed)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

- `SUPABASE_URL`: URL of your Supabase project
- `SUPABASE_ANON_KEY`: Anonymous key for your Supabase project
  - These are required only if your agent needs to interact with Supabase services

#### Logging

```
# Logging
LOG_LEVEL=info
```

- `LOG_LEVEL`: Controls the verbosity of logging
  - Valid values: `debug`, `info`, `warn`, `error`
  - Use `debug` for development and `info` or higher for production

### 4. Start the Local Development Server

Once you've configured your environment variables, you can start the local development server:

```bash
supabase functions serve mastra --env-file .env
```

This command starts a local server that runs your Mastra AI agent function. The server will be available at `http://localhost:54321/functions/v1/mastra`.

### 5. Test the Function

You can test the function using curl:

```bash
curl -X POST http://localhost:54321/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"Hello, how can you help me?"}'
```

Replace `your-secret-token` with the value you set for `AUTH_TOKEN` in your `.env` file.

## Deployment to Supabase

When you're ready to deploy your function to Supabase, follow these steps:

### 1. Set Environment Variables in Supabase

```bash
supabase secrets set --env-file .env
```

This command uploads your environment variables to Supabase as secrets, making them available to your deployed function.

### 2. Deploy the Function

```bash
supabase functions deploy mastra
```

This command deploys the Mastra AI agent function to your Supabase project.

### 3. Verify the Deployment

```bash
supabase functions list
```

This command lists all deployed functions in your Supabase project. Verify that `mastra` appears in the list.

### 4. Test the Deployed Function

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"Hello, how can you help me?"}'
```

Replace:
- `your-project-ref` with your Supabase project reference
- `your-secret-token` with the value you set for `AUTH_TOKEN`

## Environment Variable Security

When working with environment variables, follow these security best practices:

1. **Never commit `.env` files to version control**
   - Ensure `.env` is listed in your `.gitignore` file

2. **Use different tokens for development and production**
   - Generate unique tokens for each environment

3. **Rotate secrets regularly**
   - Update your `AUTH_TOKEN` and API keys periodically

4. **Limit access to your Supabase secrets**
   - Only share access with team members who need it

5. **Monitor for unauthorized access**
   - Regularly check your function logs for suspicious activity

## Troubleshooting Environment Issues

### Missing Environment Variables

If your function fails with errors about missing configuration:

1. Verify that your `.env` file contains all required variables
2. For local development, ensure you're using the `--env-file` flag
3. For deployed functions, check your secrets:

```bash
supabase secrets list
```

### Authentication Failures

If you're receiving 401 Unauthorized responses:

1. Verify that the `AUTH_TOKEN` environment variable is set correctly
2. Ensure your request includes the correct Authorization header:
   - Format: `Authorization: Bearer your-secret-token`
   - The token must match exactly what's in your environment variables

### API Integration Issues

If external API integrations (like the weather tool) are failing:

1. Verify that the corresponding API key is set correctly
2. Check that the API key has the necessary permissions
3. Ensure the API service is available and responding

## Next Steps

After completing this setup guide, you can:

1. Explore the [API documentation](../README.md#api-reference) to understand how to interact with your agent
2. Learn how to [extend the agent](../README.md#extending-the-agent) with custom tools
3. Set up [automated testing](../README.md#testing) for your agent