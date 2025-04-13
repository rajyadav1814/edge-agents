# GitHub Projects MCP Tutorial

This tutorial will guide you through using the GitHub Projects MCP (Model Context Protocol) server to manage GitHub Projects programmatically. The MCP server provides a standardized interface for AI assistants and applications to interact with GitHub Projects.

## Table of Contents

1. [Introduction](#introduction)
2. [Setup](#setup)
3. [Basic Operations](#basic-operations)
4. [Advanced Operations](#advanced-operations)
5. [Edit and Delete Operations](#edit-and-delete-operations)
6. [SSE Events](#sse-events)
7. [Troubleshooting](#troubleshooting)

## Introduction

The GitHub Projects MCP server provides tools for interacting with GitHub Projects v2 through a standardized interface. It supports both HTTP and STDIO transports, making it suitable for integration with various clients, including AI assistants.

Key features:
- Create and manage GitHub Projects
- Add and manage items within projects
- Edit project and item properties
- Delete projects and items
- Real-time updates via SSE events

## Setup

### Prerequisites

- Node.js (v14 or later)
- GitHub Personal Access Token with `project` scope
- GitHub organization where you have project creation permissions

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/github-projects-mcp.git
cd github-projects-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file
echo "GITHUB_TOKEN=your_github_token" > .env
echo "GITHUB_ORG=your_organization" >> .env
```

### Starting the Server

#### HTTP Server
```bash
npm run start:http
```

This will start the HTTP server on port 3000 by default.

#### STDIO Server
```bash
npm run start:stdio
```

This will start the STDIO server, which can be used for integration with CLI tools or AI assistants.

## Basic Operations

### Listing Projects

```javascript
const result = await mcpClient.callTool('listProjects', {
  organization: 'your-org',
  limit: 10
});

console.log(result.projects);
```

### Getting Project Details

```javascript
const result = await mcpClient.callTool('getProject', {
  organization: 'your-org',
  projectNumber: 1
});

console.log(result.project);
```

### Creating a Project

```javascript
const result = await mcpClient.callTool('createProject', {
  organization: 'your-org',
  title: 'My New Project'
});

console.log(result.project);
```

### Adding Items to a Project

```javascript
const result = await mcpClient.callTool('createProjectItem', {
  projectId: 'PVT_kwDOC6dDnM4A2KkE',
  title: 'New Task',
  body: 'This is a description of the task'
});

console.log(result.item);
```

### Getting Project Items

```javascript
const result = await mcpClient.callTool('getProjectItems', {
  projectId: 'PVT_kwDOC6dDnM4A2KkE',
  limit: 20
});

console.log(result.items);
```

## Advanced Operations

### Custom GraphQL Queries

For advanced use cases, you can execute custom GraphQL queries:

```javascript
const result = await mcpClient.callTool('executeGraphQL', {
  query: `
    query GetProjectFields($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          fields(first: 20) {
            nodes {
              ... on ProjectV2Field {
                id
                name
              }
            }
          }
        }
      }
    }
  `,
  variables: {
    projectId: 'PVT_kwDOC6dDnM4A2KkE'
  }
});

console.log(result.response);
```

## Edit and Delete Operations

### Editing a Project

You can update a project's title, description, and visibility:

```javascript
const result = await mcpClient.callTool('editProject', {
  projectId: 'PVT_kwDOC6dDnM4A2KkE',
  title: 'Updated Project Title',
  description: 'This is an updated description',
  public: true
});

console.log(result.project);
```

### Deleting a Project

To delete a project:

```javascript
const result = await mcpClient.callTool('deleteProject', {
  projectId: 'PVT_kwDOC6dDnM4A2KkE'
});

console.log(result.result); // { success: true, projectId: 'PVT_kwDOC6dDnM4A2KkE' }
```

### Editing a Project Item

You can update a project item's title and body content:

```javascript
const result = await mcpClient.callTool('editProjectItem', {
  itemId: 'PVTI_lADOABCD123',
  title: 'Updated Item Title',
  body: 'This is an updated description'
});

console.log(result.item);
```

> **Important Note**: Currently, only Draft Issues can be edited directly. The `itemId` must be the ProjectV2Item ID (starts with `PVTI_`).

### Deleting a Project Item

To delete an item from a project:

```javascript
const result = await mcpClient.callTool('deleteProjectItem', {
  itemId: 'PVTI_lADOABCD123',
  projectId: 'PVT_kwDOC6dDnM4A2KkE'
});

console.log(result.result); // { success: true, itemId: 'PVTI_lADOABCD123' }
```

## SSE Events

The HTTP server supports Server-Sent Events (SSE) for real-time updates. You can subscribe to events using:

```javascript
const eventSource = new EventSource('http://localhost:3000/sse');

eventSource.addEventListener('project_created', (event) => {
  const data = JSON.parse(event.data);
  console.log('New project created:', data.project);
});

eventSource.addEventListener('project_updated', (event) => {
  const data = JSON.parse(event.data);
  console.log('Project updated:', data.project);
});

eventSource.addEventListener('project_deleted', (event) => {
  const data = JSON.parse(event.data);
  console.log('Project deleted:', data.projectId);
});

eventSource.addEventListener('project_item_created', (event) => {
  const data = JSON.parse(event.data);
  console.log('New item created:', data.item);
});

eventSource.addEventListener('project_item_updated', (event) => {
  const data = JSON.parse(event.data);
  console.log('Item updated:', data.item);
});

eventSource.addEventListener('project_item_deleted', (event) => {
  const data = JSON.parse(event.data);
  console.log('Item deleted:', data.itemId);
});
```

## Troubleshooting

### Common Errors

1. **Authentication Errors**:
   - Ensure your GitHub token has the `project` scope
   - Check that the token is valid and not expired

2. **Permission Errors**:
   - Verify you have the necessary permissions in the GitHub organization
   - For private projects, ensure your token has access

3. **Item Editing Errors**:
   - Only Draft Issues can be edited directly
   - Make sure you're using the ProjectV2Item ID (starts with `PVTI_`)
   - For regular Issues or Pull Requests, use the GitHub Issues API

4. **Rate Limiting**:
   - The GitHub API has rate limits. If you hit them, wait before trying again
   - Consider implementing exponential backoff for retries

### Debugging

For detailed logging, set the `DEBUG` environment variable:

```bash
DEBUG=github-projects-mcp:* npm run start:http
```

This will output detailed logs of API requests and responses.

## Next Steps

- Explore the [API Documentation](./edit-delete-api.md) for more details on available operations
- Check out the [Example Usage](./example-usage-mcp-sse.md) for more complex scenarios
- See the [MCP SSE Options](./mcp-sse-options.md) for advanced SSE configuration

---

For more information, visit the [GitHub Projects MCP repository](https://github.com/your-org/github-projects-mcp) or open an issue for support.