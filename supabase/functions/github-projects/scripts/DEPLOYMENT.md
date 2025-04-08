# GitHub API Edge Function Deployment Guide

This document provides comprehensive instructions for deploying, managing, and troubleshooting the GitHub API Edge Function on Supabase.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Process](#deployment-process)
4. [Secret Management](#secret-management)
5. [Verification](#verification)
6. [Rollback Procedures](#rollback-procedures)
7. [Production Configuration](#production-configuration)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying the GitHub API Edge Function, ensure you have the following:

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed
- A Supabase project set up and linked
- A GitHub account with a personal access token
- A GitHub organization to interact with

## Environment Setup

The GitHub API Edge Function requires several environment variables to function properly:

### Required Variables

- `GITHUB_TOKEN`: A GitHub personal access token with appropriate permissions
- `GITHUB_ORG`: The GitHub organization name

### Optional Variables

- `GITHUB_API_VERSION`: GitHub API version (default: "v3")
- `GITHUB_WEBHOOK_SECRET`: Secret for verifying GitHub webhooks
- `CACHE_TTL`: Cache time-to-live in seconds (default: 300)

## Deployment Process

The deployment process is automated using the `deploy.sh` script. This script handles validation, deployment, and verification.

### Basic Deployment

To deploy the GitHub API Edge Function:

1. Make sure you're in the function directory:
   ```bash
   cd supabase/functions/github-api
   ```

2. Set up your environment variables using the `manage-secrets.sh` script:
   ```bash
   ./manage-secrets.sh --create-env
   # Edit the .env file with your values
   ./manage-secrets.sh --set
   ```

3. Run the deployment script:
   ```bash
   ./deploy.sh
   ```

### Deployment Options

The deployment script supports the following options:

- Basic deployment: `./deploy.sh`
- Rollback to previous version: `./deploy.sh --rollback`

## Secret Management

The `manage-secrets.sh` script provides tools for managing the function's secrets securely.

### Available Commands

- List current secrets: `./manage-secrets.sh --list`
- Set secrets from .env file: `./manage-secrets.sh --set`
- Remove all secrets: `./manage-secrets.sh --remove`
- Rotate GitHub token: `./manage-secrets.sh --rotate-token`
- Create .env.example file: `./manage-secrets.sh --create-env`

### Setting Up Secrets

1. Create a .env file:
   ```bash
   ./manage-secrets.sh --create-env
   ```

2. Edit the .env file with your values:
   ```
   GITHUB_TOKEN=your_github_token
   GITHUB_ORG=your_github_organization
   GITHUB_API_VERSION=v3
   GITHUB_WEBHOOK_SECRET=your_webhook_secret
   CACHE_TTL=300
   ```

3. Set the secrets in Supabase:
   ```bash
   ./manage-secrets.sh --set
   ```

## Verification

After deployment, you can verify that the function is working correctly using the `verify-deployment.sh` script.

### Available Verification Checks

- Run all checks: `./verify-deployment.sh --all`
- Verify basic connectivity: `./verify-deployment.sh --connect`
- Verify environment variables: `./verify-deployment.sh --env`
- Verify GraphQL endpoint: `./verify-deployment.sh --graphql`
- Verify Projects endpoint: `./verify-deployment.sh --projects`

## Rollback Procedures

If you encounter issues with a deployment, you can use the `rollback.sh` script to revert to a previous version.

### Rollback Options

- List deployment history: `./rollback.sh --list`
- Rollback to a specific version: `./rollback.sh --version VERSION_ID`
- Rollback to the previous version: `./rollback.sh --previous`
- Create a backup of the current code: `./rollback.sh --backup`
- Restore from a backup: `./rollback.sh --restore ./backups/backup_TIMESTAMP`

### Rollback Process

1. List the deployment history:
   ```bash
   ./rollback.sh --list
   ```

2. Rollback to the previous version:
   ```bash
   ./rollback.sh --previous
   ```

3. Verify the rollback:
   ```bash
   ./verify-deployment.sh --all
   ```

## Production Configuration

The `production-config.json` file contains settings optimized for production use. This includes:

- Memory allocation: 128 MB
- Timeout: 60 seconds
- Max concurrency: 50 requests
- Rate limiting: 100 requests per minute
- CORS configuration
- Caching settings
- Logging configuration

### Customizing Production Settings

Edit the `production-config.json` file to adjust settings for your specific needs. After making changes, redeploy the function.

## Troubleshooting

### Common Issues

1. **Authentication Errors (401)**
   - Check that your GitHub token is valid and has the necessary permissions
   - Rotate the token using `./manage-secrets.sh --rotate-token`

2. **Not Found Errors (404)**
   - Verify that the GitHub organization name is correct
   - Check that the requested resources exist

3. **Rate Limiting (429)**
   - GitHub API has rate limits that may be exceeded
   - Consider implementing caching or reducing request frequency

4. **Deployment Failures**
   - Check the Supabase CLI output for specific errors
   - Verify that all required environment variables are set
   - Ensure the function code is valid

### Logs and Debugging

To view logs for the GitHub API Edge Function:

```bash
supabase functions logs github-api
```

For real-time logs during testing:

```bash
supabase functions logs github-api --follow
```

## Additional Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)