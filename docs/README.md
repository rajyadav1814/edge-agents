# GitHub API Edge Function

This edge function provides a secure proxy to the GitHub API, allowing you to interact with GitHub repositories and projects from your application.

## Features

- **Repository Listing**: Get a list of repositories for your organization
- **README Fetching**: Get the README content for a specific repository
- **Projects API**: Interact with GitHub Projects (v2) using GraphQL
  - List projects
  - Get project details
  - Add items to projects
  - Update project item fields

## Authentication

The function uses a GitHub token for authentication, which should be set as an environment variable:

```
GITHUB_TOKEN=your_github_token
```

The token should have the appropriate permissions:
- `repo` scope for repository operations
- `project` scope for project operations

## API Endpoints

### Repository Operations

#### List Repositories

```
GET /github-api
```

Returns a list of repositories for the configured organization.

#### Get Repository README

```
GET /github-api/readme/{repo-name}
```

Returns the README content for the specified repository.

### Projects API

#### List Projects

```
GET /github-api/projects/list?type=organization&owner=your-org-name
```

Parameters:
- `type`: Either "organization" or "user" (default: "organization")
- `owner`: The organization or user name (default: value from GITHUB_ORG env var)
- `first`: Number of projects to return (default: 20)

#### Get Project Details

```
GET /github-api/projects/detail?type=organization&owner=your-org-name&number=123
```

Parameters:
- `type`: Either "organization" or "user" (default: "organization")
- `owner`: The organization or user name (default: value from GITHUB_ORG env var)
- `number`: The project number (required)

#### Add Item to Project

```
POST /github-api/projects/add-item
Content-Type: application/json

{
  "projectId": "PROJECT_NODE_ID",
  "contentId": "ISSUE_OR_PR_NODE_ID"
}
```

Adds an issue or pull request to a project.

#### Update Project Item Field

```
POST /github-api/projects/update-field
Content-Type: application/json

{
  "projectId": "PROJECT_NODE_ID",
  "itemId": "ITEM_NODE_ID",
  "fieldId": "FIELD_NODE_ID",
  "value": "FIELD_VALUE"
}
```

Updates a field value for a project item.

## Error Handling

The API returns appropriate HTTP status codes and error messages in JSON format:

```json
{
  "error": "Error message",
  "details": { /* Additional error details */ },
  "timestamp": "2025-04-07T18:27:56.000Z"
}
```

Common error codes:
- `400`: Bad Request - Missing or invalid parameters
- `401`: Unauthorized - Invalid or missing GitHub token
- `403`: Forbidden - Rate limit exceeded or insufficient permissions
- `404`: Not Found - Resource not found
- `500`: Internal Server Error - Unexpected error

## Rate Limiting

The function respects GitHub's rate limits and will return a 403 error when the rate limit is exceeded, including information about when the rate limit will reset.

## Development

### Environment Variables

- `GITHUB_TOKEN`: GitHub personal access token (required)
- `GITHUB_ORG`: Default GitHub organization (required)
- `GITHUB_API_VERSION`: GitHub API version (default: "v3")
- `WEBHOOK_SECRET`: Secret for GitHub webhooks (optional)
- `CACHE_TTL`: Cache time-to-live in seconds (default: 60)

### Testing

Run the tests using Deno:

```bash
deno test
```

### Deployment

Deploy the function to Supabase:

```bash
supabase functions deploy github-api
```

## Examples

### List Projects

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/github-api/projects/list');
const data = await response.json();
console.log(data);
```

### Get Project Details

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/github-api/projects/detail?number=1');
const data = await response.json();
console.log(data);
```

### Add Issue to Project

```javascript
const response = await fetch('https://your-project.supabase.co/functions/v1/github-api/projects/add-item', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    projectId: 'PVT_kwDOABCD123',
    contentId: 'I_kwDOABCD456'
  })
});
const data = await response.json();
console.log(data);