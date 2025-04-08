# GitHub Projects API Example Usage

This document provides practical examples of using the GitHub Projects API integration edge function, including sample curl commands and response examples for common operations.

## Authentication

All requests to the Supabase edge function require authentication. For simplicity, these examples use the anon key, but in a production environment, you should use proper authentication.

```bash
# Set your Supabase URL and anon key
SUPABASE_URL="https://your-project-ref.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
```

## REST API Proxy Examples

### List Organization Repositories

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/github-api" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "orgs/your-org-name/repos",
    "method": "GET"
  }'
```

**Sample Response:**

```json
{
  "data": [
    {
      "id": 123456789,
      "node_id": "R_kgDOA1B2Cw",
      "name": "example-repo",
      "full_name": "your-org-name/example-repo",
      "private": false,
      "owner": {
        "login": "your-org-name",
        "id": 12345678,
        "node_id": "MDEyOk9yZ2FuaXphdGlvbjEyMzQ1Njc4",
        "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4",
        "url": "https://api.github.com/users/your-org-name"
      },
      "html_url": "https://github.com/your-org-name/example-repo",
      "description": "An example repository",
      "created_at": "2023-01-15T12:30:45Z",
      "updated_at": "2023-02-20T09:15:30Z"
    }
  ],
  "meta": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4999,
      "reset": 1617984476,
      "resetDate": "2023-04-09T10:34:36.000Z"
    },
    "pagination": {
      "page": 1,
      "perPage": 30,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

### Create an Issue

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/github-api" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "endpoint": "repos/your-org-name/example-repo/issues",
    "method": "POST",
    "data": {
      "title": "New issue from API",
      "body": "This issue was created via the GitHub API integration.",
      "labels": ["bug", "high-priority"]
    }
  }'
```

**Sample Response:**

```json
{
  "data": {
    "id": 1234567890,
    "node_id": "MDU6SXNzdWUxMjM0NTY3ODkw",
    "url": "https://api.github.com/repos/your-org-name/example-repo/issues/42",
    "number": 42,
    "title": "New issue from API",
    "user": {
      "login": "github-user",
      "id": 12345678
    },
    "labels": [
      {
        "id": 123456789,
        "node_id": "MDU6TGFiZWwxMjM0NTY3ODk=",
        "url": "https://api.github.com/repos/your-org-name/example-repo/labels/bug",
        "name": "bug",
        "color": "d73a4a"
      },
      {
        "id": 987654321,
        "node_id": "MDU6TGFiZWw5ODc2NTQzMjE=",
        "url": "https://api.github.com/repos/your-org-name/example-repo/labels/high-priority",
        "name": "high-priority",
        "color": "b60205"
      }
    ],
    "state": "open",
    "created_at": "2023-04-09T10:34:36Z",
    "updated_at": "2023-04-09T10:34:36Z",
    "body": "This issue was created via the GitHub API integration."
  },
  "meta": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4998,
      "reset": 1617984476,
      "resetDate": "2023-04-09T10:34:36.000Z"
    }
  }
}
```

## GraphQL API Examples

### Query Viewer Information

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/github-api/graphql" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query { viewer { login, name, avatarUrl } }"
  }'
```

**Sample Response:**

```json
{
  "data": {
    "viewer": {
      "login": "github-user",
      "name": "GitHub User",
      "avatarUrl": "https://avatars.githubusercontent.com/u/12345678?v=4"
    }
  }
}
```

### Query Repository Issues with GraphQL

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/github-api/graphql" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { issues(first: 5, states: OPEN) { nodes { number, title, url, createdAt } } } }",
    "variables": {
      "owner": "your-org-name",
      "name": "example-repo"
    }
  }'
```

**Sample Response:**

```json
{
  "data": {
    "repository": {
      "issues": {
        "nodes": [
          {
            "number": 42,
            "title": "New issue from API",
            "url": "https://github.com/your-org-name/example-repo/issues/42",
            "createdAt": "2023-04-09T10:34:36Z"
          },
          {
            "number": 41,
            "title": "Another issue",
            "url": "https://github.com/your-org-name/example-repo/issues/41",
            "createdAt": "2023-04-08T15:22:10Z"
          }
        ]
      }
    }
  }
}
```

## Projects API Examples

### List Projects

```bash
curl -X GET "${SUPABASE_URL}/functions/v1/github-api/projects" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

**Sample Response:**

```json
{
  "data": {
    "organization": {
      "projectsV2": {
        "nodes": [
          {
            "id": "PVT_kwDOABC123",
            "title": "Development Roadmap",
            "shortDescription": "Project tracking development tasks and milestones",
            "url": "https://github.com/orgs/your-org-name/projects/1",
            "closed": false,
            "createdAt": "2023-01-15T12:30:45Z",
            "updatedAt": "2023-04-01T09:15:30Z"
          },
          {
            "id": "PVT_kwDODEF456",
            "title": "Bug Tracking",
            "shortDescription": "Project for tracking and prioritizing bugs",
            "url": "https://github.com/orgs/your-org-name/projects/2",
            "closed": false,
            "createdAt": "2023-02-10T08:45:12Z",
            "updatedAt": "2023-04-05T14:22:33Z"
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
    "rateLimit": {
      "limit": 5000,
      "remaining": 4997,
      "reset": 1617984476,
      "resetDate": "2023-04-09T10:34:36.000Z"
    }
  }
}
```

### Get a Specific Project

```bash
curl -X GET "${SUPABASE_URL}/functions/v1/github-api/projects/1" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

**Sample Response:**

```json
{
  "data": {
    "organization": {
      "projectV2": {
        "id": "PVT_kwDOABC123",
        "title": "Development Roadmap",
        "shortDescription": "Project tracking development tasks and milestones",
        "url": "https://github.com/orgs/your-org-name/projects/1",
        "closed": false,
        "createdAt": "2023-01-15T12:30:45Z",
        "updatedAt": "2023-04-01T09:15:30Z",
        "fields": {
          "nodes": [
            {
              "id": "PVTF_lADOABC123",
              "name": "Status"
            },
            {
              "id": "PVTF_lADODEF456",
              "name": "Priority",
              "options": [
                {
                  "id": "option_1",
                  "name": "High",
                  "color": "F44336"
                },
                {
                  "id": "option_2",
                  "name": "Medium",
                  "color": "FB8C00"
                },
                {
                  "id": "option_3",
                  "name": "Low",
                  "color": "4CAF50"
                }
              ]
            }
          ]
        }
      }
    }
  },
  "meta": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4996,
      "reset": 1617984476,
      "resetDate": "2023-04-09T10:34:36.000Z"
    }
  }
}
```

### Get Project Items

```bash
curl -X GET "${SUPABASE_URL}/functions/v1/github-api/projects/1/items" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

**Sample Response:**

```json
{
  "data": {
    "node": {
      "items": {
        "nodes": [
          {
            "id": "PVTI_lADOABC123",
            "content": {
              "id": "I_kwDOGHI789",
              "title": "Implement new feature",
              "number": 42,
              "state": "OPEN",
              "repository": {
                "name": "example-repo"
              }
            },
            "fieldValues": {
              "nodes": [
                {
                  "text": null,
                  "field": {
                    "name": "Status"
                  }
                },
                {
                  "name": "High",
                  "field": {
                    "name": "Priority"
                  }
                }
              ]
            }
          },
          {
            "id": "PVTI_lADODEF456",
            "content": {
              "id": "I_kwDOJKL012",
              "title": "Fix critical bug",
              "number": 41,
              "state": "OPEN",
              "repository": {
                "name": "example-repo"
              }
            },
            "fieldValues": {
              "nodes": [
                {
                  "text": null,
                  "field": {
                    "name": "Status"
                  }
                },
                {
                  "name": "High",
                  "field": {
                    "name": "Priority"
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
    "rateLimit": {
      "limit": 5000,
      "remaining": 4995,
      "reset": 1617984476,
      "resetDate": "2023-04-09T10:34:36.000Z"
    }
  }
}
```

### Add an Issue to a Project

First, get the ID of the issue you want to add:

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/github-api/graphql" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query($owner: String!, $name: String!, $number: Int!) { repository(owner: $owner, name: $name) { issue(number: $number) { id } } }",
    "variables": {
      "owner": "your-org-name",
      "name": "example-repo",
      "number": 42
    }
  }'
```

Then, add the issue to the project:

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/github-api/projects/1/add-item" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "contentId": "I_kwDOGHI789"
  }'
```

**Sample Response:**

```json
{
  "data": {
    "addProjectV2ItemById": {
      "item": {
        "id": "PVTI_lADOMNO345"
      }
    }
  },
  "meta": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4994,
      "reset": 1617984476,
      "resetDate": "2023-04-09T10:34:36.000Z"
    }
  }
}
```

### Update a Project Item Field

First, find the field ID you want to update:

```bash
curl -X GET "${SUPABASE_URL}/functions/v1/github-api/projects/1" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

Then, update the field value:

```bash
curl -X POST "${SUPABASE_URL}/functions/v1/github-api/projects/1/update-item" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "itemId": "PVTI_lADOMNO345",
    "fieldId": "PVTF_lADOABC123",
    "value": "In Progress"
  }'
```

**Sample Response:**

```json
{
  "data": {
    "updateProjectV2ItemFieldValue": {
      "projectV2Item": {
        "id": "PVTI_lADOMNO345"
      }
    }
  },
  "meta": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4993,
      "reset": 1617984476,
      "resetDate": "2023-04-09T10:34:36.000Z"
    }
  }
}
```

## Repository API Examples

### Get Repository Details

```bash
curl -X GET "${SUPABASE_URL}/functions/v1/github-api/repos/example-repo" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

**Sample Response:**

```json
{
  "data": {
    "id": 123456789,
    "node_id": "R_kgDOA1B2Cw",
    "name": "example-repo",
    "full_name": "your-org-name/example-repo",
    "private": false,
    "owner": {
      "login": "your-org-name",
      "id": 12345678,
      "node_id": "MDEyOk9yZ2FuaXphdGlvbjEyMzQ1Njc4",
      "avatar_url": "https://avatars.githubusercontent.com/u/12345678?v=4",
      "url": "https://api.github.com/users/your-org-name"
    },
    "html_url": "https://github.com/your-org-name/example-repo",
    "description": "An example repository",
    "created_at": "2023-01-15T12:30:45Z",
    "updated_at": "2023-02-20T09:15:30Z",
    "pushed_at": "2023-04-01T14:25:16Z",
    "git_url": "git://github.com/your-org-name/example-repo.git",
    "ssh_url": "git@github.com:your-org-name/example-repo.git",
    "clone_url": "https://github.com/your-org-name/example-repo.git",
    "size": 1024,
    "language": "TypeScript",
    "default_branch": "main"
  },
  "meta": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4992,
      "reset": 1617984476,
      "resetDate": "2023-04-09T10:34:36.000Z"
    }
  }
}
```

### List Repository Issues

```bash
curl -X GET "${SUPABASE_URL}/functions/v1/github-api/repos/example-repo/issues" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
```

**Sample Response:**

```json
{
  "data": [
    {
      "id": 1234567890,
      "node_id": "MDU6SXNzdWUxMjM0NTY3ODkw",
      "url": "https://api.github.com/repos/your-org-name/example-repo/issues/42",
      "number": 42,
      "title": "New issue from API",
      "user": {
        "login": "github-user",
        "id": 12345678
      },
      "labels": [
        {
          "id": 123456789,
          "name": "bug",
          "color": "d73a4a"
        },
        {
          "id": 987654321,
          "name": "high-priority",
          "color": "b60205"
        }
      ],
      "state": "open",
      "created_at": "2023-04-09T10:34:36Z",
      "updated_at": "2023-04-09T10:34:36Z",
      "body": "This issue was created via the GitHub API integration."
    }
  ],
  "meta": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 4991,
      "reset": 1617984476,
      "resetDate": "2023-04-09T10:34:36.000Z"
    },
    "pagination": {
      "page": 1,
      "perPage": 30,
      "hasNextPage": false,
      "hasPreviousPage": false
    }
  }
}
```

## Webhook Example

GitHub will send webhook events to your endpoint. Here's an example of testing the webhook endpoint:

```bash
# You'd typically not call this directly - GitHub calls it
curl -X POST "${SUPABASE_URL}/functions/v1/github-api/webhook" \
  -H "X-Hub-Signature-256: sha256=hash_generated_by_github" \
  -H "X-GitHub-Event: issues" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "opened",
    "issue": {
      "id": 1234567890,
      "node_id": "MDU6SXNzdWUxMjM0NTY3ODkw",
      "number": 42,
      "title": "New issue from webhook",
      "user": {
        "login": "github-user",
        "id": 12345678
      },
      "state": "open",
      "created_at": "2023-04-09T10:34:36Z",
      "updated_at": "2023-04-09T10:34:36Z"
    },
    "repository": {
      "id": 123456789,
      "name": "example-repo",
      "full_name": "your-org-name/example-repo"
    },
    "organization": {
      "login": "your-org-name",
      "id": 12345678
    },
    "sender": {
      "login": "github-user",
      "id": 12345678
    }
  }'
```

**Sample Response:**

```json
{
  "message": "Received issues event"
}
```

## Error Handling Examples

### Rate Limit Exceeded

```json
{
  "error": "GitHub API error: GitHub API rate limit exceeded. Resets at 2023-04-09T11:34:36.000Z",
  "details": {
    "rateLimit": {
      "limit": 5000,
      "remaining": 0,
      "reset": 1617988476
    }
  },
  "timestamp": "2023-04-09T10:34:36.000Z"
}
```

### Resource Not Found

```json
{
  "error": "GitHub API error: Not Found",
  "details": {
    "documentation": "https://docs.github.com/rest/reference/repos#get-a-repository"
  },
  "timestamp": "2023-04-09T10:34:36.000Z"
}
```

### Missing Required Field

```json
{
  "error": "Missing required field: query",
  "timestamp": "2023-04-09T10:34:36.000Z"
}
```

## Batching Multiple Requests

For complex workflows, you can use Promise.all() in your client code to batch multiple requests:

```javascript
async function addIssueToProject() {
  // Step 1: Create an issue
  const issueResponse = await fetch(`${SUPABASE_URL}/functions/v1/github-api`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      endpoint: 'repos/your-org-name/example-repo/issues',
      method: 'POST',
      data: {
        title: 'New issue for project',
        body: 'This issue will be added to the project automatically.'
      }
    })
  });
  
  const issueData = await issueResponse.json();
  const issueNumber = issueData.data.number;
  
  // Step 2: Get the issue ID
  const issueIdResponse = await fetch(`${SUPABASE_URL}/functions/v1/github-api/graphql`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: `query($owner: String!, $name: String!, $number: Int!) { 
        repository(owner: $owner, name: $name) { 
          issue(number: $number) { 
            id 
          } 
        } 
      }`,
      variables: {
        owner: 'your-org-name',
        name: 'example-repo',
        number: issueNumber
      }
    })
  });
  
  const issueIdData = await issueIdResponse.json();
  const issueId = issueIdData.data.repository.issue.id;
  
  // Step 3: Add the issue to the project
  const addToProjectResponse = await fetch(`${SUPABASE_URL}/functions/v1/github-api/projects/1/add-item`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contentId: issueId
    })
  });
  
  return await addToProjectResponse.json();
}