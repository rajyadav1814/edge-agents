
# GitHub Projects API Reference

This document provides a comprehensive reference for the GitHub Projects API integration edge function.

## Base URL

All API endpoints are accessible through a base URL with the function name:

```
https://your-supabase-project.supabase.co/functions/v1/github-api
```

## Authentication

All requests to the GitHub API integration require authentication. The edge function handles GitHub authentication internally using a stored GitHub token.

Client authentication to the edge function itself should be managed through your Supabase project's authentication mechanisms.

## Response Format

All successful responses follow a standard format:

```json
{
  "data": {
    // The response data
  },
  "meta": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4999,
      "reset": 1617984476,
      "resetDate": "2025-04-09T10:34:36.000Z"
    },
    "pagination": {
      "page": 1,
      "perPage": 30,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

## Error Format

Error responses follow a standard format:

```json
{
  "error": "Error message",
  "details": {
    // Additional error details if available
  },
  "timestamp": "2025-04-09T10:34:36.000Z"
}
```

## Endpoints

### REST API Proxy

Provides a direct proxy to GitHub's REST API.

```
POST /github-api
```

#### Request Body

```json
{
  "endpoint": "repos/org-name/repo-name/issues",
  "method": "POST",
  "data": {
    "title": "New issue",
    "body": "Issue description"
  }
}
```

| Parameter | Type   | Description |
|-----------|--------|-------------|
| endpoint  | string | GitHub API endpoint path or full URL |
| method    | string | HTTP method (GET, POST, PUT, PATCH, DELETE) |
| data      | object | Request body data (for POST, PUT, PATCH) |

#### Response

```json
{
  "data": {
    // GitHub API response
  },
  "meta": {
    // Rate limit and pagination information
  }
}
```

### GraphQL API

Execute arbitrary GraphQL queries against GitHub's GraphQL API.

```
POST /github-api/graphql
```

#### Request Body

```json
{
  "query": "query { viewer { login } }",
  "variables": {},
  "operationName": "GetViewer"
}
```

| Parameter     | Type   | Description |
|---------------|--------|-------------|
| query         | string | GraphQL query string (required) |
| variables     | object | Query variables (optional) |
| operationName | string | Operation name (optional) |

#### Response

```json
{
  "data": {
    // GraphQL response data
  },
  "errors": [
    // GraphQL errors, if any
  ]
}
```

### Projects API

#### List Projects

Retrieves all GitHub Projects for the configured organization.

```
GET /github-api/projects
```

Query Parameters:
- `first` (optional): Number of projects to return (default: 20)

#### Response

```json
{
  "data": {
    "organization": {
      "projectsV2": {
        "nodes": [
          {
            "id": "PVTID",
            "title": "Project Title",
            "shortDescription": "Project description",
            "url": "https://github.com/orgs/org-name/projects/1",
            "closed": false,
            "createdAt": "2023-01-01T00:00:00Z",
            "updatedAt": "2023-01-02T00:00:00Z"
          }
        ],
        "pageInfo": {
          "hasNextPage": false,
          "endCursor": "cursor-string"
        }
      }
    }
  },
  "meta": {
    // Rate limit information
  }
}
```

#### Get Project

Retrieves a specific GitHub Project by number.

```
GET /github-api/projects/{project-number}
```

Path Parameters:
- `project-number`: The project number (required)

#### Response

```json
{
  "data": {
    "organization": {
      "projectV2": {
        "id": "PVTID",
        "title": "Project Title",
        "shortDescription": "Project description",
        "url": "https://github.com/orgs/org-name/projects/1",
        "closed": false,
        "createdAt": "2023-01-01T00:00:00Z",
        "updatedAt": "2023-01-02T00:00:00Z",
        "fields": {
          "nodes": [
            {
              "id": "PVTF_ID",
              "name": "Status"
            },
            {
              "id": "PVTF_ID",
              "name": "Priority",
              "options": [
                {
                  "id": "option_id",
                  "name": "High",
                  "color": "RED"
                }
              ]
            }
          ]
        }
      }
    }
  },
  "meta": {
    // Rate limit information
  }
}
```

#### Get Project Items

Retrieves items in a specific GitHub Project.

```
GET /github-api/projects/{project-number}/items
```

Path Parameters:
- `project-number`: The project number (required)

Query Parameters:
- `first` (optional): Number of items to return (default: 100)

#### Response

```json
{
  "data": {
    "node": {
      "items": {
        "nodes": [
          {
            "id": "PVTI_ID",
            "content": {
              "id": "I_ID",
              "title": "Issue or PR title",
              "number": 123,
              "state": "OPEN",
              "repository": {
                "name": "repo-name"
              }
            },
            "fieldValues": {
              "nodes": [
                {
                  "text": "Field value",
                  "field": {
                    "name": "Field name"
                  }
                }
              ]
            }
          }
        ],
        "pageInfo": {
          "hasNextPage": false,
          "endCursor": "cursor-string"
        }
      }
    }
  },
  "meta": {
    // Rate limit information
  }
}
```

#### Add Item to Project

Adds an issue or pull request to a GitHub Project.

```
POST /github-api/projects/{project-number}/add-item
```

Path Parameters:
- `project-number`: The project number (required)

Request Body:
```json
{
  "contentId": "I_kwDOGYAHjM5jQDMx"
}
```

| Parameter | Type   | Description |
|-----------|--------|-------------|
| contentId | string | GitHub ID of the issue or PR to add (required) |

#### Response

```json
{
  "data": {
    "addProjectV2ItemById": {
      "item": {
        "id": "PVTI_lADOBFxmpc4AeZjzgM1Egg"
      }
    }
  },
  "meta": {
    // Rate limit information
  }
}
```

#### Update Project Item Field

Updates a field value for an item in a GitHub Project.

```
POST /github-api/projects/{project-number}/update-item
```

Path Parameters:
- `project-number`: The project number (required)

Request Body:
```json
{
  "itemId": "PVTI_lADOBFxmpc4AeZjzgM1Egg",
  "fieldId": "PVTF_lADOBFxmpc4AeZjzgM1EgA",
  "value": "In Progress"
}
```

| Parameter | Type   | Description |
|-----------|--------|-------------|
| itemId    | string | ID of the project item (required) |
| fieldId   | string | ID of the field to update (required) |
| value     | any    | New value for the field (required) |

#### Response

```json
{
  "data": {
    "updateProjectV2ItemFieldValue": {
      "projectV2Item": {
        "id": "PVTI_lADOBFxmpc4AeZjzgM1Egg"
      }
    }
  },
  "meta": {
    // Rate limit information
  }
}
```

### Repositories API

#### List Organization Repositories

```
GET /github-api/repos
```

#### Get Repository

```
GET /github-api/repos/{repo-name}
```

Path Parameters:
- `repo-name`: The repository name (required)

#### Get Repository Issues

```
GET /github-api/repos/{repo-name}/issues
```

Path Parameters:
- `repo-name`: The repository name (required)

### Webhooks

Process GitHub webhooks, validating their signatures before handling them.

```
POST /github-api/webhook
```

Headers:
- `X-Hub-Signature-256`: GitHub webhook signature (required)
- `X-GitHub-Event`: GitHub event type (required)

Body:
- Raw webhook payload from GitHub

#### Response

```json
{
  "message": "Received event-type event"
}
```

## Status Codes

| Status Code | Description |
|-------------|-------------|
| 200         | Success |
| 204         | Success (No Content) |
| 400         | Bad Request - Invalid parameters |
| 401         | Unauthorized - Missing or invalid authentication |
| 403         | Forbidden - Rate limit exceeded or permission denied |
| 404         | Not Found - Resource not found |
| 405         | Method Not Allowed - Invalid HTTP method |
| 422         | Unprocessable Entity - Validation failed |
| 500         | Internal Server Error - Server-side error |

## Rate Limiting

The GitHub API has rate limits that are enforced by GitHub. The edge function forwards rate limit information in response headers:

- `X-GitHub-Rate-Limit-Limit`: Total number of requests allowed per hour
- `X-GitHub-Rate-Limit-Remaining`: Remaining requests in the current window
- `X-GitHub-Rate-Limit-Reset`: Unix timestamp when the rate limit resets