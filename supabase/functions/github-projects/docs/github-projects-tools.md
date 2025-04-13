# GitHub Projects MCP Tools

This document describes the tools available in the GitHub Projects MCP server for managing GitHub Projects, creating sub-items, and handling SSH authentication issues.

## Project Management Tools

### Basic Project Operations

| Tool | Description |
|------|-------------|
| `getRepository` | Get details about a GitHub repository |
| `listProjects` | List GitHub Projects in an organization |
| `getProject` | Get details about a GitHub Project |
| `createProject` | Create a new GitHub Project |
| `editProject` | Edit a GitHub Project |
| `deleteProject` | Delete a GitHub Project |

### Project Items Management

| Tool | Description |
|------|-------------|
| `createProjectItem` | Create a new item in a GitHub Project |
| `getProjectItems` | Get items in a GitHub Project |
| `editProjectItem` | Edit an item in a GitHub Project |
| `deleteProjectItem` | Delete an item from a GitHub Project |
| `updateProjectFieldValue` | Update a field value for a project item |
| `addItemToProject` | Add an existing issue or PR to a project |

### Sub-Items and Advanced Features

| Tool | Description |
|------|-------------|
| `createSubIssue` | Create a sub-issue linked to a parent issue |
| `executeGraphQL` | Execute a custom GraphQL query against the GitHub API |

## SSH Authentication Tools

These tools help resolve SSH authentication issues when working with GitHub repositories in npm installations:

| Tool | Description |
|------|-------------|
| `addSSHKeyToAgent` | Add SSH key to SSH agent to fix authentication issues |
| `generateSSHKey` | Generate a new SSH key for GitHub authentication |
| `updatePackageJsonRepos` | Update package.json to use HTTPS instead of SSH for GitHub repositories |
| `testGitHubConnection` | Test SSH connection to GitHub |
| `setupCodespacesAuth` | Configure GitHub Codespaces for GitHub authentication |

## Usage Examples

### Creating a Project and Adding Items

```javascript
// Create a new project
const projectResult = await mcp.tools.createProject({
  organization: "myorg",
  title: "My New Project"
});

const projectId = projectResult.project.id;

// Create a project item
const itemResult = await mcp.tools.createProjectItem({
  projectId: projectId,
  title: "Task 1",
  body: "This is a task description"
});
```

### Creating Sub-Issues

```javascript
// First get the repository ID
const repoResult = await mcp.tools.getRepository({
  owner: "myorg",
  repo: "myrepo"
});

const repositoryId = repoResult.repository.id;

// Create a parent issue
const parentIssueResult = await mcp.tools.executeGraphQL({
  query: `
    mutation CreateIssue($repositoryId: ID!, $title: String!, $body: String!) {
      createIssue(input: {repositoryId: $repositoryId, title: $title, body: $body}) {
        issue {
          id
          url
        }
      }
    }
  `,
  variables: {
    repositoryId: repositoryId,
    title: "Parent Issue",
    body: "This is the parent issue"
  }
});

const parentIssueUrl = parentIssueResult.response.createIssue.issue.url;

// Create a sub-issue linked to the parent
const subIssueResult = await mcp.tools.createSubIssue({
  repositoryId: repositoryId,
  title: "Sub-Issue",
  body: "This is a sub-issue",
  parentIssueUrl: parentIssueUrl
});
```

### Fixing SSH Authentication Issues

```javascript
// Test the GitHub connection
const testResult = await mcp.tools.testGitHubConnection();

if (!testResult.result.success) {
  // Try adding the SSH key to the agent
  await mcp.tools.addSSHKeyToAgent();
  
  // If that doesn't work, update package.json to use HTTPS
  await mcp.tools.updatePackageJsonRepos({
    packageJsonPath: "./package.json"
  });
  
  // For Codespaces, set up GitHub authentication
  await mcp.tools.setupCodespacesAuth();
}
```

## Advanced GraphQL Usage

For more complex operations, you can use the `executeGraphQL` tool with custom queries:

```javascript
const result = await mcp.tools.executeGraphQL({
  query: `
    query($projectId: ID!) {
      node(id: $projectId) {
        ... on ProjectV2 {
          items(first: 10) {
            nodes {
              id
              content {
                ... on Issue { title }
                ... on PullRequest { title }
              }
            }
          }
        }
      }
    }
  `,
  variables: {
    projectId: "your-project-id"
  }
});
```

## Error Handling

All tools return a standardized response format:

```javascript
{
  content: [
    {
      type: 'text',
      text: '...' // JSON string of the result
    }
  ],
  result: { ... }, // The actual result object
  isError: true/false // Present only if there was an error
}
```

When an error occurs, check the `isError` flag and the error message in the `text` field.