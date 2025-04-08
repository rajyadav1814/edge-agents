# MCP and SSE Example Usage

This document provides practical examples of using the MCP and SSE integration options in the GitHub Projects API.

## MCP Examples

### HTTP MCP Server Examples

#### 1. MCP Discovery Endpoint

```bash
# Get MCP discovery information
curl -X GET "http://localhost:8002/.well-known/mcp.json"
```

**Sample Response:**

```json
{
  "version": "2024-11-05",
  "serverInfo": {
    "name": "GitHub Projects MCP Server",
    "version": "1.0.0"
  },
  "capabilities": {
    "transports": ["http", "sse", "stream"],
    "messageFormats": ["json"],
    "compressionFormats": []
  },
  "endpoints": {
    "tools/list": "/tools/list",
    "tools/call": "/tools/call",
    "sse": "/sse",
    "stream": "/stream"
  }
}
```

#### 2. List Available Tools

```bash
# List available tools
curl -X GET "http://localhost:8002/tools/list"
```

**Sample Response:**

```json
{
  "tools": [
    {
      "name": "getRepository",
      "description": "Get repository information",
      "parameters": {
        "owner": {
          "type": "string",
          "description": "Repository owner (organization or user)"
        },
        "repo": {
          "type": "string",
          "description": "Repository name"
        }
      }
    },
    {
      "name": "listProjects",
      "description": "List projects for an organization",
      "parameters": {
        "organization": {
          "type": "string",
          "description": "GitHub organization name"
        }
      }
    },
    {
      "name": "getProject",
      "description": "Get project details",
      "parameters": {
        "organization": {
          "type": "string",
          "description": "GitHub organization name"
        },
        "projectNumber": {
          "type": "integer",
          "description": "Project number"
        }
      }
    },
    {
      "name": "executeGraphQL",
      "description": "Execute a GraphQL query against the GitHub API",
      "parameters": {
        "query": {
          "type": "string",
          "description": "GraphQL query string"
        },
        "variables": {
          "type": "object",
          "description": "Variables for the GraphQL query"
        }
      }
    },
    {
      "name": "createProject",
      "description": "Create a new project in the organization",
      "parameters": {
        "organization": {
          "type": "string",
          "description": "GitHub organization name"
        },
        "title": {
          "type": "string",
          "description": "Project title"
        }
      }
    }
  ]
}
```

#### 3. Call a Tool

```bash
# Call the listProjects tool
curl -X POST "http://localhost:8002/tools/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "listProjects",
    "arguments": {
      "organization": "your-org-name"
    }
  }'
```

**Sample Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Projects for organization your-org-name:"
    },
    {
      "type": "json",
      "json": {
        "projects": [
          {
            "id": "PVT_kwDOABC123",
            "title": "Development Roadmap",
            "shortDescription": "Project tracking development tasks and milestones",
            "url": "https://github.com/orgs/your-org-name/projects/1",
            "number": 1,
            "closed": false,
            "createdAt": "2023-01-15T12:30:45Z",
            "updatedAt": "2023-04-01T09:15:30Z"
          },
          {
            "id": "PVT_kwDODEF456",
            "title": "Bug Tracking",
            "shortDescription": "Project for tracking and prioritizing bugs",
            "url": "https://github.com/orgs/your-org-name/projects/2",
            "number": 2,
            "closed": false,
            "createdAt": "2023-02-10T08:45:12Z",
            "updatedAt": "2023-04-05T14:22:33Z"
          }
        ]
      }
    }
  ]
}
```

#### 4. Create a Project

```bash
# Call the createProject tool
curl -X POST "http://localhost:8002/tools/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "createProject",
    "arguments": {
      "organization": "your-org-name",
      "title": "New Project from MCP"
    }
  }'
```

**Sample Response:**

```json
{
  "content": [
    {
      "type": "text",
      "text": "Project created successfully:"
    },
    {
      "type": "json",
      "json": {
        "id": "PVT_kwDOGHI789",
        "title": "New Project from MCP",
        "shortDescription": "",
        "url": "https://github.com/orgs/your-org-name/projects/3",
        "number": 3,
        "closed": false,
        "createdAt": "2025-04-08T15:22:10Z",
        "updatedAt": "2025-04-08T15:22:10Z"
      }
    }
  ],
  "project": {
    "id": "PVT_kwDOGHI789",
    "title": "New Project from MCP",
    "shortDescription": "",
    "url": "https://github.com/orgs/your-org-name/projects/3",
    "number": 3,
    "closed": false,
    "createdAt": "2025-04-08T15:22:10Z",
    "updatedAt": "2025-04-08T15:22:10Z"
  }
}
```

### Stdio MCP Server Examples

#### 1. Initialize Connection

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "Cline",
      "version": "3.9.2"
    }
  }
}
```

**Sample Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "serverInfo": {
      "name": "GitHub Projects MCP Server",
      "version": "1.0.0"
    },
    "capabilities": {
      "tools": true
    }
  }
}
```

#### 2. List Tools

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "mcp.tools.list"
}
```

**Sample Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "getRepository",
        "description": "Get repository information",
        "parameters": {
          "owner": {
            "type": "string",
            "description": "Repository owner (organization or user)"
          },
          "repo": {
            "type": "string",
            "description": "Repository name"
          }
        }
      },
      {
        "name": "listProjects",
        "description": "List projects for an organization",
        "parameters": {
          "organization": {
            "type": "string",
            "description": "GitHub organization name"
          }
        }
      }
    ]
  }
}
```

#### 3. Call a Tool

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "mcp.tools.call",
  "params": {
    "name": "listProjects",
    "arguments": {
      "organization": "your-org-name"
    }
  }
}
```

**Sample Response:**

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Projects for organization your-org-name:"
      },
      {
        "type": "json",
        "json": {
          "projects": [
            {
              "id": "PVT_kwDOABC123",
              "title": "Development Roadmap",
              "shortDescription": "Project tracking development tasks and milestones",
              "url": "https://github.com/orgs/your-org-name/projects/1",
              "number": 1,
              "closed": false,
              "createdAt": "2023-01-15T12:30:45Z",
              "updatedAt": "2023-04-01T09:15:30Z"
            },
            {
              "id": "PVT_kwDODEF456",
              "title": "Bug Tracking",
              "shortDescription": "Project for tracking and prioritizing bugs",
              "url": "https://github.com/orgs/your-org-name/projects/2",
              "number": 2,
              "closed": false,
              "createdAt": "2023-02-10T08:45:12Z",
              "updatedAt": "2023-04-05T14:22:33Z"
            }
          ]
        }
      }
    ]
  }
}
```

## SSE Examples

### 1. Basic SSE Connection

```javascript
// Browser JavaScript
const eventSource = new EventSource('http://localhost:8002/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received update:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

### 2. SSE with Project Monitoring

First, start monitoring a project using the MCP tool:

```bash
curl -X POST "http://localhost:8002/tools/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "monitorProject",
    "arguments": {
      "organization": "your-org-name",
      "projectNumber": 1
    }
  }'
```

Then connect to the SSE endpoint to receive updates:

```javascript
// Browser JavaScript
const eventSource = new EventSource('http://localhost:8002/sse');

eventSource.addEventListener('project_update', (event) => {
  const data = JSON.parse(event.data);
  console.log('Project update:', data);
});

eventSource.addEventListener('project_item_added', (event) => {
  const data = JSON.parse(event.data);
  console.log('Item added to project:', data);
});

eventSource.addEventListener('project_item_updated', (event) => {
  const data = JSON.parse(event.data);
  console.log('Project item updated:', data);
});

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

### 3. SSE with Node.js

```javascript
// Node.js example using eventsource package
const EventSource = require('eventsource');

const eventSource = new EventSource('http://localhost:8002/sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received update:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};

// Listen for specific event types
eventSource.addEventListener('project_update', (event) => {
  const data = JSON.parse(event.data);
  console.log('Project update:', data);
});
```

## Combined MCP and SSE Examples

### 1. Create a Project and Monitor Updates

```javascript
// First, create a project using MCP
async function createAndMonitorProject() {
  // Create the project
  const createResponse = await fetch('http://localhost:8002/tools/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'createProject',
      arguments: {
        organization: 'your-org-name',
        title: 'Monitored Project'
      }
    })
  });
  
  const createData = await createResponse.json();
  const projectNumber = createData.project.number;
  console.log(`Created project #${projectNumber}`);
  
  // Start monitoring the project
  await fetch('http://localhost:8002/tools/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'monitorProject',
      arguments: {
        organization: 'your-org-name',
        projectNumber: projectNumber
      }
    })
  });
  
  console.log(`Monitoring project #${projectNumber}`);
  
  // Connect to SSE to receive updates
  const eventSource = new EventSource('http://localhost:8002/sse');
  
  eventSource.addEventListener('project_update', (event) => {
    const data = JSON.parse(event.data);
    console.log('Project update:', data);
  });
  
  return projectNumber;
}

// Call the function
createAndMonitorProject().then(projectNumber => {
  console.log(`Project #${projectNumber} is being monitored`);
});
```

### 2. Add Items to a Project and Track Changes

```javascript
// Add an item to a project and track changes
async function addItemAndTrackChanges(projectNumber) {
  // Create an issue
  const createIssueResponse = await fetch('http://localhost:8002/tools/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'createIssue',
      arguments: {
        owner: 'your-org-name',
        repo: 'example-repo',
        title: 'Test issue for project tracking',
        body: 'This issue will be tracked in the project'
      }
    })
  });
  
  const issueData = await createIssueResponse.json();
  const issueId = issueData.issue.id;
  
  // Add the issue to the project
  await fetch('http://localhost:8002/tools/call', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'addProjectItem',
      arguments: {
        organization: 'your-org-name',
        projectNumber: projectNumber,
        contentId: issueId
      }
    })
  });
  
  console.log(`Added issue to project #${projectNumber}`);
  
  // Connect to SSE to receive updates
  const eventSource = new EventSource('http://localhost:8002/sse');
  
  eventSource.addEventListener('project_item_added', (event) => {
    const data = JSON.parse(event.data);
    console.log('Item added to project:', data);
  });
  
  return issueId;
}
```

## Error Handling Examples

### 1. MCP Error Response

```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32602,
    "message": "Invalid params: Missing required parameter 'organization'",
    "data": {
      "details": "The 'organization' parameter is required for the listProjects tool"
    }
  }
}
```

### 2. SSE Connection Error

```javascript
const eventSource = new EventSource('http://localhost:8002/sse');

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
  
  // Implement reconnection logic
  setTimeout(() => {
    console.log('Attempting to reconnect...');
    eventSource.close();
    const newEventSource = new EventSource('http://localhost:8002/sse');
    // Set up event handlers for the new connection
  }, 5000);
};
```

## Testing with Command Line

### 1. Test MCP with curl

```bash
# Test MCP discovery
curl -X GET "http://localhost:8002/.well-known/mcp.json"

# Test listing tools
curl -X GET "http://localhost:8002/tools/list"

# Test calling a tool
curl -X POST "http://localhost:8002/tools/call" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "listProjects",
    "arguments": {
      "organization": "your-org-name"
    }
  }'
```

### 2. Test SSE with curl

```bash
# Test SSE connection (will stream responses)
curl -N "http://localhost:8002/sse"
```

### 3. Test Stdio MCP with netcat

```bash
# Connect to the Unix socket
echo '{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "Test Client",
      "version": "1.0.0"
    }
  }
}' | nc -U /tmp/mcp.sock