# GitHub Projects API Troubleshooting Guide

This guide provides solutions for common issues you might encounter when using the GitHub Projects API integration edge function.

## Error Response Format

When troubleshooting, it's important to understand the error response format. All error responses from the API follow this structure:

```json
{
  "error": "Error message",
  "details": {
    // Additional error details if available
  },
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

## Authentication Issues

### Invalid or Missing GitHub Token

**Error:**
```json
{
  "error": "GitHub API error: Bad credentials",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Verify that the `GITHUB_TOKEN` environment variable is set correctly
2. Ensure the token hasn't expired or been revoked
3. Check if the token has the required scopes for the operation
4. Generate a new token if necessary

```bash
# Check if the token is set
supabase secrets list | grep GITHUB_TOKEN

# Set a new token
supabase secrets set GITHUB_TOKEN=your_new_token
```

### Missing Organization

**Error:**
```json
{
  "error": "GITHUB_ORG environment variable is required",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Set the `GITHUB_ORG` environment variable to your GitHub organization name

```bash
supabase secrets set GITHUB_ORG=your_organization_name
```

### Invalid Webhook Signature

**Error:**
```json
{
  "error": "Invalid webhook signature",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Verify that the `GITHUB_WEBHOOK_SECRET` environment variable is set correctly
2. Ensure the webhook is configured in GitHub with the exact same secret
3. Check if the webhook request includes the `X-Hub-Signature-256` header

## Rate Limiting Issues

### Rate Limit Exceeded

**Error:**
```json
{
  "error": "GitHub API error: GitHub API rate limit exceeded. Resets at 2025-04-09T11:34:36.000Z",
  "details": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 0,
      "reset": 1617988476
    }
  },
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Wait until the rate limit resets (time indicated in the error)
2. Implement caching to reduce API calls
3. Increase the `CACHE_TTL` environment variable to cache responses longer
4. Optimize your code to batch API requests
5. Consider using a GitHub App instead of a PAT for higher rate limits

```bash
# Increase cache time to 10 minutes (600 seconds)
supabase secrets set CACHE_TTL=600
```

### Secondary Rate Limit

**Error:**
```json
{
  "error": "GitHub API error: You have exceeded a secondary rate limit",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Implement exponential backoff for retries
2. Reduce the frequency of writes to GitHub
3. Space out your API calls more evenly

## Permission Issues

### Repository Access Denied

**Error:**
```json
{
  "error": "GitHub API error: Not Found",
  "details": {
    "documentation": "https://docs.github.com/rest/reference/repos#get-a-repository"
  },
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Ensure the token has access to the repository
2. Check if the repository exists and is spelled correctly
3. Verify that the token owner has the necessary permissions in the organization
4. For private repositories, ensure the token has the `repo` scope

### Organization Access Denied

**Error:**
```json
{
  "error": "GitHub API error: Resource not accessible by integration",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Ensure the token has the `read:org` scope
2. Verify that the token owner is a member of the organization
3. For organization projects, ensure the token has the `project` scope
4. Check organization access settings for third-party applications

## GraphQL API Issues

### Invalid GraphQL Query

**Error:**
```json
{
  "data": null,
  "errors": [
    {
      "message": "Parse error on \"invalid\" (IDENTIFIER) at [1, 8]",
      "locations": [
        {
          "line": 1,
          "column": 8
        }
      ]
    }
  ]
}
```

**Solution:**
1. Validate your GraphQL syntax
2. Use a GraphQL explorer to test your queries
3. Check field names and arguments
4. Ensure you're using the correct GraphQL schema version

### Missing Required Field

**Error:**
```json
{
  "error": "Missing required field: query",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Ensure your request includes a `query` field
2. Check your request payload format
3. Verify that content-type is set correctly to `application/json`

## Projects API Issues

### Project Not Found

**Error:**
```json
{
  "error": "GitHub API error: Could not resolve to a ProjectV2 with the number 123.",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Verify the project number is correct
2. Ensure the project belongs to the configured organization
3. Check if the project has been deleted or archived
4. Verify the token has permissions to access the project

### Invalid Item ID

**Error:**
```json
{
  "error": "GitHub API error: Could not resolve to a Node with the global id of 'invalid-id'.",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Double-check the item ID format
2. Ensure the item exists in the project
3. Get a fresh item ID by querying the project items

### Invalid Field ID

**Error:**
```json
{
  "error": "GitHub API error: Field 'invalid-field-id' doesn't exist on type 'UpdateProjectV2ItemFieldValueInput'.",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Verify the field ID format
2. Query the project fields to get the correct ID
3. Ensure the field exists on the project

### Invalid Field Value

**Error:**
```json
{
  "error": "GitHub API error: Could not resolve to a ProjectV2SingleSelectField option with the name of 'Invalid Status'.",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. For single select fields, ensure the value matches one of the options
2. Query the field options to get the list of valid values
3. Check the case sensitivity of option names

## Webhook Issues

### Webhook Not Configured

**Error:**
```json
{
  "error": "Webhook secret not configured",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Set the `GITHUB_WEBHOOK_SECRET` environment variable
2. Configure the webhook in GitHub with the same secret

```bash
# Generate a new webhook secret
SECRET=$(openssl rand -hex 20)
echo $SECRET

# Set the secret
supabase secrets set GITHUB_WEBHOOK_SECRET=$SECRET
```

### Webhook Delivery Failures

**Problem:** Webhooks are configured but not being delivered

**Solution:**
1. Check GitHub webhook settings for recent deliveries and failures
2. Verify the webhook URL is correct and accessible
3. Ensure your Supabase project is on a paid plan for longer function execution
4. Check for any firewall or network issues
5. Verify SSL certificates are valid

## Deployment Issues

### Function Deployment Failures

**Problem:** Unable to deploy the function to Supabase

**Solution:**
1. Check for syntax errors in your code
2. Ensure the function doesn't exceed size limits
3. Verify your Supabase CLI is up to date
4. Check Supabase status for any service issues

```bash
# Update Supabase CLI
npm update -g supabase

# Deploy with verbose logging
supabase functions deploy github-api --debug
```

### Function Execution Timeout

**Error:**
```json
{
  "error": "Function execution timeout",
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

**Solution:**
1. Optimize your code for faster execution
2. Break down complex operations into multiple requests
3. For complex queries, consider implementing pagination
4. Upgrade to a higher Supabase tier for longer function timeouts

## Environment Variable Issues

### Missing Environment Variables

**Problem:** Function fails to start or returns unexpected errors

**Solution:**
1. Verify all required environment variables are set
2. Check variable names for typos
3. Use the Supabase dashboard to check configured secrets

```bash
# List all secrets
supabase secrets list

# Set missing variables
supabase secrets set VARIABLE_NAME=value
```

### Cache Configuration Issues

**Problem:** Data is stale or not updating as expected

**Solution:**
1. Adjust the `CACHE_TTL` environment variable
2. For development, consider setting it to a lower value
3. For production, balance performance with data freshness

```bash
# Set cache TTL to 60 seconds for development
supabase secrets set CACHE_TTL=60

# Set cache TTL to 300 seconds (5 minutes) for production
supabase secrets set CACHE_TTL=300
```

## Client Integration Issues

### CORS Errors

**Error:**
```
Access to fetch at 'https://example.supabase.co/functions/v1/github-api' from origin 'https://yourdomain.com' has been blocked by CORS policy
```

**Solution:**
1. Update the CORS configuration in the edge function code
2. Modify the `corsHeaders` object in `../_shared/cors.ts`
3. Deploy the updated function

Example CORS configuration:
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
```

### API Key Authentication Issues

**Error:**
```json
{
  "message": "JWT token is invalid",
  "statusCode": 401
}
```

**Solution:**
1. Verify you're using the correct Supabase API key
2. For client applications, use the `anon` key
3. For server applications, consider using the `service_role` key
4. Ensure the Authorization header is formatted correctly: `Bearer your-api-key`

## Performance Issues

### Slow Response Times

**Problem:** API requests take a long time to complete

**Solution:**
1. Implement caching for frequently accessed data
2. Use specific endpoints rather than the generic proxy
3. Request only the fields you need in GraphQL queries
4. Use pagination for large data sets
5. Monitor rate limits and adjust request frequency

### Memory Issues

**Problem:** Function crashes or returns 500 errors for large requests

**Solution:**
1. Reduce the amount of data requested at once
2. Implement pagination for large data sets
3. Optimize GraphQL queries to select only needed fields
4. Consider splitting complex operations into multiple functions

## Supabase-Specific Issues

### Function Not Found

**Error:**
```json
{
  "message": "Function not found: github-api",
  "statusCode": 404
}
```

**Solution:**
1. Verify the function is deployed
2. Check the function name for typos
3. Ensure you're using the correct Supabase project URL

```bash
# List deployed functions
supabase functions list
```

### Function Invocation Errors

**Error:**
```json
{
  "message": "Failed to invoke function",
  "statusCode": 500
}
```

**Solution:**
1. Check Supabase logs for details
2. Verify environment variables are set correctly
3. Test the function locally to identify issues
4. Check for any dependency or import errors

```bash
# View function logs
supabase functions logs github-api
```

## Diagnostic Tools

### Checking Function Logs

View the function execution logs for debugging:

```bash
supabase functions logs github-api
```

### Testing Function Locally

Run the function locally for easier debugging:

```bash
supabase functions serve github-api --env-file .env
```

### Validating GraphQL Queries

Use the GitHub GraphQL Explorer to validate queries:

1. Go to [GitHub GraphQL Explorer](https://docs.github.com/en/graphql/overview/explorer)
2. Authenticate with your GitHub account
3. Test your queries before implementing them in code

### Rate Limit Checking

Check your current rate limit status:

```bash
curl -H "Authorization: Bearer ${GITHUB_TOKEN}" \
  https://api.github.com/rate_limit
```

## Getting Help

If you're still experiencing issues:

1. Check the GitHub API documentation:
   - [REST API](https://docs.github.com/en/rest)
   - [GraphQL API](https://docs.github.com/en/graphql)
   - [Projects API](https://docs.github.com/en/issues/planning-and-tracking-with-projects)

2. Look for similar issues in the GitHub community forums

3. Contact Supabase support for function-specific issues:
   - [Supabase Support](https://supabase.com/support)
   - [Supabase Community](https://github.com/supabase/supabase/discussions)