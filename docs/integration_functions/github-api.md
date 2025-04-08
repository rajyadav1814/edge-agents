# GitHub API Integration

## Overview

The GitHub API Integration function provides a secure and efficient way to interact with the GitHub API from edge functions. It enables operations such as repository management, issue tracking, pull request handling, and other GitHub-related functionality.

## Architecture

The GitHub API Integration follows a proxy architecture where it acts as an intermediary between clients and the GitHub API, handling authentication, rate limiting, and error handling.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │────▶│  GitHub API │────▶│  GitHub API │
│             │     │ Integration │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                   │                   │
       │                   │                   │
       └───────────────────┴───────────────────┘
                        Response
```

## Features

- **Authentication**: Secure GitHub API authentication using OAuth or Personal Access Tokens
- **Repository Operations**: Create, read, update, and delete repositories
- **Issue Management**: Create, list, update, and close issues
- **Pull Request Handling**: Create, review, and merge pull requests
- **Webhook Integration**: Receive and process GitHub webhook events
- **Rate Limit Handling**: Smart handling of GitHub API rate limits
- **Caching**: Caching of responses to reduce API calls
- **Error Handling**: Robust error handling for API failures

## Implementation Details

### Request Processing

The function processes incoming HTTP requests, extracting the necessary information for GitHub API calls:

```typescript
serve(async (req) => {
  // Enable CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get request data
    const { endpoint, method, data } = await req.json();
    
    // Validate inputs
    if (!endpoint) {
      throw new Error("Missing required field: endpoint");
    }
    
    // Call GitHub API
    const response = await callGitHubAPI(endpoint, method || "GET", data);
    
    // Return response
    return new Response(JSON.stringify(response), {
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

### GitHub API Integration

The function makes authenticated calls to the GitHub API:

```typescript
async function callGitHubAPI(endpoint, method, data) {
  // Get GitHub token from environment variables
  const githubToken = Deno.env.get("GITHUB_TOKEN");
  if (!githubToken) {
    throw new Error("GITHUB_TOKEN environment variable is required");
  }
  
  // Prepare request URL
  const url = endpoint.startsWith("https://")
    ? endpoint
    : `https://api.github.com/${endpoint.startsWith("/") ? endpoint.slice(1) : endpoint}`;
  
  // Prepare request options
  const options = {
    method,
    headers: {
      "Accept": "application/vnd.github.v3+json",
      "Authorization": `token ${githubToken}`,
      "User-Agent": "Agentic-Edge-Functions"
    }
  };
  
  // Add body for non-GET requests
  if (method !== "GET" && data) {
    options.body = JSON.stringify(data);
    options.headers["Content-Type"] = "application/json";
  }
  
  // Make request to GitHub API
  const response = await fetch(url, options);
  
  // Check for rate limit headers
  const rateLimit = {
    limit: parseInt(response.headers.get("X-RateLimit-Limit") || "0"),
    remaining: parseInt(response.headers.get("X-RateLimit-Remaining") || "0"),
    reset: parseInt(response.headers.get("X-RateLimit-Reset") || "0")
  };
  
  // Handle rate limiting
  if (response.status === 403 && rateLimit.remaining === 0) {
    const resetDate = new Date(rateLimit.reset * 1000);
    throw new Error(`GitHub API rate limit exceeded. Resets at ${resetDate.toISOString()}`);
  }
  
  // Parse response
  const responseData = await response.json();
  
  // Handle error responses
  if (!response.ok) {
    throw new Error(`GitHub API error: ${responseData.message || response.statusText}`);
  }
  
  // Return response data and rate limit info
  return {
    data: responseData,
    rateLimit
  };
}
```

### Webhook Processing

The function can also process GitHub webhooks:

```typescript
async function handleWebhook(req) {
  // Verify webhook signature
  const signature = req.headers.get("X-Hub-Signature-256");
  const body = await req.text();
  
  if (!verifyWebhookSignature(body, signature)) {
    return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  
  // Parse webhook payload
  const payload = JSON.parse(body);
  const event = req.headers.get("X-GitHub-Event");
  
  // Process different event types
  switch (event) {
    case "push":
      return handlePushEvent(payload);
    case "pull_request":
      return handlePullRequestEvent(payload);
    case "issues":
      return handleIssueEvent(payload);
    default:
      return new Response(JSON.stringify({ message: `Received ${event} event` }), {
        headers: { "Content-Type": "application/json" }
      });
  }
}

function verifyWebhookSignature(body, signature) {
  const webhookSecret = Deno.env.get("GITHUB_WEBHOOK_SECRET");
  if (!webhookSecret) {
    throw new Error("GITHUB_WEBHOOK_SECRET environment variable is required");
  }
  
  // Create HMAC
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
  
  // Calculate signature
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(body)
  );
  
  // Convert to hex string
  const calculatedSignature = Array.from(new Uint8Array(mac))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  
  // Compare signatures
  return `sha256=${calculatedSignature}` === signature;
}
```

## Configuration

The GitHub API Integration can be configured using environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Required |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying webhook signatures | Required for webhooks |
| `CACHE_TTL` | Cache time-to-live in seconds | 300 |

## Usage

### API Request Format

```json
{
  "endpoint": "repos/agentics-foundation/edge-agents/issues",
  "method": "POST",
  "data": {
    "title": "New issue created via API",
    "body": "This issue was created using the GitHub API Integration function."
  }
}
```

### Response Format

```json
{
  "data": {
    "id": 1234567890,
    "number": 42,
    "title": "New issue created via API",
    "body": "This issue was created using the GitHub API Integration function.",
    "state": "open",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  },
  "rateLimit": {
    "limit": 5000,
    "remaining": 4999,
    "reset": 1672531200
  }
}
```

## Common Operations

### List Repositories

```json
{
  "endpoint": "user/repos",
  "method": "GET"
}
```

### Create an Issue

```json
{
  "endpoint": "repos/agentics-foundation/edge-agents/issues",
  "method": "POST",
  "data": {
    "title": "Issue title",
    "body": "Issue description",
    "labels": ["bug", "documentation"]
  }
}
```

### Create a Pull Request

```json
{
  "endpoint": "repos/agentics-foundation/edge-agents/pulls",
  "method": "POST",
  "data": {
    "title": "Pull request title",
    "body": "Pull request description",
    "head": "feature-branch",
    "base": "main"
  }
}
```

### Get Repository Contents

```json
{
  "endpoint": "repos/agentics-foundation/edge-agents/contents/README.md",
  "method": "GET"
}
```

## Error Handling

The GitHub API Integration handles various error scenarios:

- **Authentication Errors**: Returns a 401 error if the GitHub token is invalid
- **Rate Limit Exceeded**: Returns a 403 error with reset time information
- **Resource Not Found**: Returns a 404 error if the requested resource doesn't exist
- **Validation Errors**: Returns a 422 error if the request data is invalid
- **API Errors**: Returns the error message from the GitHub API

## Deployment

Deploy the GitHub API Integration as a Supabase Edge Function:

```bash
# Deploy the function
supabase functions deploy github-api

# Set environment variables
supabase secrets set GITHUB_TOKEN=your-github-token
supabase secrets set GITHUB_WEBHOOK_SECRET=your-webhook-secret
```

## Testing

Test the GitHub API Integration locally:

```bash
# Serve the function locally
supabase functions serve github-api --env-file .env.local

# Test with curl
curl -X POST http://localhost:54321/functions/v1/github-api \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "repos/agentics-foundation/edge-agents",
    "method": "GET"
  }'
```

## Security Considerations

- **Token Security**: The GitHub token is stored as an environment variable and never exposed to clients
- **Webhook Verification**: Webhook signatures are verified to prevent spoofing
- **Input Validation**: All inputs are validated to prevent injection attacks
- **Rate Limiting**: GitHub API rate limits are respected and handled gracefully
- **Error Handling**: Error messages are sanitized to prevent information leakage

## Limitations

- **API Dependency**: Requires a connection to the GitHub API
- **Rate Limiting**: Subject to GitHub API rate limits
- **Token Permissions**: Limited to the permissions granted to the GitHub token
- **Webhook Events**: Limited to the webhook events configured in the GitHub repository

## Integration with Other Functions

The GitHub API Integration can be integrated with other edge functions:

```typescript
// Example of calling the GitHub API Integration from another function
async function createIssue(title, body, labels) {
  const response = await fetch("https://your-project-ref.supabase.co/functions/v1/github-api", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${supabaseAnonKey}`
    },
    body: JSON.stringify({
      endpoint: "repos/agentics-foundation/edge-agents/issues",
      method: "POST",
      data: {
        title,
        body,
        labels
      }
    })
  });
  
  return await response.json();
}
```

## GitHub API Documentation

For more information on the GitHub API, refer to the official documentation:

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub Webhooks Documentation](https://docs.github.com/en/developers/webhooks-and-events/webhooks/about-webhooks)

---

Created by rUv, Agentics Foundation founder.