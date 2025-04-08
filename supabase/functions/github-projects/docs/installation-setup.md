# GitHub Projects API Installation & Setup Guide

This guide explains how to install, configure, and deploy the GitHub Projects API integration edge function.

## Prerequisites

Before you begin, ensure you have the following:

1. A Supabase project set up and configured
2. [Supabase CLI](https://supabase.com/docs/guides/cli) installed (v1.0.0 or later)
3. [Deno](https://deno.land/) installed (v1.30.0 or later)
4. A GitHub account with appropriate permissions to the organization and repositories
5. A GitHub Personal Access Token with the necessary scopes

## Environment Variables

The GitHub API integration requires the following environment variables:

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes | - |
| `GITHUB_ORG` | GitHub Organization name | Yes | - |
| `GITHUB_API_VERSION` | GitHub API version | No | `v3` |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying webhook signatures | No | - |
| `CACHE_TTL` | Cache time-to-live in seconds | No | `300` |

### GitHub Token Permissions

The GitHub Personal Access Token requires the following permissions:

- For REST API access:
  - `repo` - Full control of private repositories
  - `read:org` - Read organization information
  - `admin:org` - For organization projects access

- For GraphQL API and Projects:
  - `repo` - Full control of private repositories
  - `read:org` - Read organization information
  - `project` - Full control of organization projects

### Creating a GitHub Token

1. Go to [GitHub Developer Settings](https://github.com/settings/tokens)
2. Click "Generate new token" and select "Generate new token (classic)"
3. Add a note to identify this token (e.g., "Supabase GitHub API Integration")
4. Select the required scopes as listed above
5. Click "Generate token"
6. Copy the token immediately (it won't be shown again)

## Local Development Setup

### 1. Clone the Project or Create the Edge Function

If you're adding this to an existing project, create the necessary directory structure:

```bash
mkdir -p supabase/functions/github-api/{services,utils,tests}
```

### 2. Create .env File

Create a `.env` file in the edge function directory:

```bash
cd supabase/functions/github-api
touch .env
```

Add your environment variables to the `.env` file:

```
GITHUB_TOKEN=your_github_token_here
GITHUB_ORG=your_organization_name
GITHUB_API_VERSION=v3
GITHUB_WEBHOOK_SECRET=your_webhook_secret
CACHE_TTL=300
```

### 3. Create .env.example

Create a `.env.example` file to document required environment variables without including actual values:

```bash
touch .env.example
```

Add template environment variables to `.env.example`:

```
GITHUB_TOKEN=your_github_token_here
GITHUB_ORG=your_organization_name
GITHUB_API_VERSION=v3
GITHUB_WEBHOOK_SECRET=your_webhook_secret
CACHE_TTL=300
```

### 4. Running Locally

To run the edge function locally for testing:

```bash
# Start the development server with auto-reloading
supabase start
supabase functions serve github-api --env-file .env
```

Or use Deno directly:

```bash
cd supabase/functions/github-api
deno task dev
```

This will start the function at `http://localhost:54321/functions/v1/github-api`.

## Deployment to Supabase

### 1. Deploy the Edge Function

Deploy the function to your Supabase project:

```bash
supabase functions deploy github-api
```

### 2. Configure Environment Variables

Set the required environment variables for your deployed function:

```bash
supabase secrets set GITHUB_TOKEN=your_github_token_here
supabase secrets set GITHUB_ORG=your_organization_name
supabase secrets set GITHUB_API_VERSION=v3
supabase secrets set GITHUB_WEBHOOK_SECRET=your_webhook_secret
supabase secrets set CACHE_TTL=300
```

You can also set these variables through the Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Settings > API > Edge Functions
3. Click on the "github-api" function
4. Add the required environment variables

### 3. Testing the Deployed Function

Test your deployed function with a simple request:

```bash
curl -X GET "https://your-project-ref.supabase.co/functions/v1/github-api/projects" \
  -H "Authorization: Bearer your_supabase_anon_key"
```

## Webhook Setup

To use the GitHub webhook functionality:

1. Generate a webhook secret:

```bash
openssl rand -hex 20
```

2. Add this secret to your environment variables as `GITHUB_WEBHOOK_SECRET`

3. Configure the webhook in GitHub:
   - Go to your GitHub organization settings
   - Navigate to Webhooks > Add webhook
   - Set the Payload URL to `https://your-project-ref.supabase.co/functions/v1/github-api/webhook`
   - Set Content type to `application/json`
   - Enter your webhook secret
   - Select the events you want to trigger the webhook
   - Enable SSL verification
   - Click "Add webhook"

## Verifying the Installation

To verify that the GitHub API integration is working correctly:

1. Check that the function is deployed:

```bash
supabase functions list
```

2. Test the API with a simple projects listing:

```bash
curl -X GET "https://your-project-ref.supabase.co/functions/v1/github-api/projects" \
  -H "Authorization: Bearer your_supabase_anon_key"
```

You should see a list of GitHub Projects in the response.

## Troubleshooting

If you encounter issues with your deployment:

1. Check your environment variables are set correctly:

```bash
supabase secrets list
```

2. Verify your GitHub token has the appropriate permissions and hasn't expired

3. Check function logs for any errors:

```bash
supabase functions logs github-api
```

4. Ensure your Supabase project is on a paid plan if you need longer function execution times or higher memory limits

5. If webhook verification fails, double-check that the webhook secret matches exactly between GitHub and your function configuration