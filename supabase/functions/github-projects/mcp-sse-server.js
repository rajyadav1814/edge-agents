/**
 * MCP HTTP server with SSE for GitHub Projects API
 * 
 * This server implements the Model Context Protocol (MCP) using the official SDK.
 * It provides tools for interacting with GitHub repositories and projects,
 * and supports Server-Sent Events (SSE) for real-time updates.
 */

const express = require('express');
const http = require('node:http');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const z = require('zod');

// Server configuration
const PORT = 8002;

// GitHub API integration
const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const githubOrg = process.env.GITHUB_ORG || 'agenticsorg';

if (!githubToken) {
  console.error('GitHub token is required. Set GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN environment variable.');
  process.exit(1);
}

// Configuration object
const config = {
  githubToken,
  githubOrg,
  githubApiVersion: process.env.GITHUB_API_VERSION || 'v3',
  cacheTtl: parseInt(process.env.CACHE_TTL || '300')
};

// Import our services
const { ProjectEditService } = require('./services/project-edit-service.js');
const { ProjectDeleteService } = require('./services/project-delete-service.js');
const { GitHubProjectService } = require('./services/github-project-service.js');
const { SSHAuthService } = require('./services/ssh-auth-service.js');
const { executeGraphQLQuery } = require('./utils/graphql-client.js');
const { executeCommand } = require('./utils/command-executor.js');
const { GitHubIssueService } = require('./services/github-issue-service.js');
const { GitHubStatusService } = require('./services/github-status-service.js');
const { SSEEventEmitter } = require('./scripts/build/dist/src/sse/event-emitter.js');

// Create an MCP server
const server = new McpServer({
  name: 'github-projects-mcp',
  version: '1.0.0'
});

// Initialize services
const sseEmitter = new SSEEventEmitter();
const projectEditService = new ProjectEditService(config);
const projectDeleteService = new ProjectDeleteService(config);
const githubProjectService = new GitHubProjectService(config);
const githubIssueService = new GitHubIssueService(config);
const sshAuthService = new SSHAuthService(config);
const githubStatusService = new GitHubStatusService(config);

/**
 * Make a request to the GitHub REST API
 * @param {string} endpoint - API endpoint (without the base URL)
 * @param {string} method - HTTP method
 * @param {object} body - Request body for POST/PUT/PATCH requests
 * @returns {Promise<object>} - API response
 */
async function callGitHubRestApi(endpoint, method = 'GET', body = null) {
  try {
    const url = `https://api.github.com/${endpoint}`;
    console.error(`Calling GitHub REST API: ${method} ${url}`);
    
    const headers = {
      'Accept': 'application/json',
      'User-Agent': 'Agentics-Supabase-Edge-Function',
      'Authorization': `token ${config.githubToken}`
    };
    
    // Add content-type for requests with body
    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      headers['Content-Type'] = 'application/json';
    }
    
    const requestOptions = {
      method,
      headers,
      ...(body ? { body: JSON.stringify(body) } : {})
    };
    
    const response = await fetch(url, requestOptions);
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    // For 204 No Content responses, return empty object
    if (response.status === 204) {
      return {};
    }
    
    return await response.json();
  } catch (error) {
    console.error('REST API error:', error);
    throw error;
  }
}

// Add getRepository tool
server.tool(
  'getRepository',
  {
    owner: z.string().describe('Repository owner'),
    repo: z.string().describe('Repository name')
  },
  async ({ owner, repo }) => {
    try {
      const repoData = await callGitHubRestApi(`repos/${owner}/${repo}`);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(repoData, null, 2)
          }
        ],
        repository: repoData
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add listProjects tool
server.tool(
  'listProjects',
  {
    organization: z.string().describe('Organization name'),
    limit: z.number().optional().default(10).describe('Maximum number of projects to return')
  },
  async ({ organization, limit }) => {
    try {
      // GraphQL query to list projects
      const query = `
        query ListProjects($org: String!, $first: Int!) {
          organization(login: $org) {
            projectsV2(first: $first) {
              nodes {
                id
                title
                number
                shortDescription
                public
                url
                closed
                createdAt
                updatedAt
              }
            }
          }
        }
      `;
      
      const variables = { org: organization, first: limit };
      const result = await executeGraphQLQuery(query, variables, config.githubToken);
      
      if (!result.data || !result.data.organization) {
        throw new Error(`Organization ${organization} not found or not accessible`);
      }
      
      const projects = result.data.organization.projectsV2.nodes;
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(projects, null, 2)
          }
        ],
        projects: projects
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add getProject tool
server.tool(
  'getProject',
  {
    organization: z.string().describe('Organization name'),
    projectNumber: z.number().describe('Project number')
  },
  async ({ organization, projectNumber }) => {
    try {
      // GraphQL query to get project details
      const query = `
        query GetProject($org: String!, $number: Int!) {
          organization(login: $org) {
            projectV2(number: $number) {
              id
              title
              number
              shortDescription
              public
              url
              closed
              createdAt
              updatedAt
              fields(first: 20) {
                nodes {
                  ... on ProjectV2Field {
                    id
                    name
                  }
                  ... on ProjectV2IterationField {
                    id
                    name
                    configuration {
                      iterations {
                        startDate
                        id
                      }
                    }
                  }
                  ... on ProjectV2SingleSelectField {
                    id
                    name
                    options {
                      id
                      name
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const variables = { org: organization, number: projectNumber };
      const result = await executeGraphQLQuery(query, variables, config.githubToken);
      
      if (!result.data || !result.data.organization || !result.data.organization.projectV2) {
        throw new Error(`Project #${projectNumber} not found in organization ${organization}`);
      }
      
      const project = result.data.organization.projectV2;
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(project, null, 2)
          }
        ],
        project: project
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add createProject tool
server.tool(
  'createProject',
  {
    organization: z.string().describe('Organization name'),
    title: z.string().describe('Project title')
  },
  async ({ organization, title }) => {
    try {
      // First get the organization ID
      const orgQuery = `
        query GetOrganizationId($login: String!) {
          organization(login: $login) {
            id
          }
        }
      `;
      
      const orgResult = await executeGraphQLQuery(orgQuery, { login: organization }, config.githubToken);
      
      if (!orgResult.data || !orgResult.data.organization || !orgResult.data.organization.id) {
        throw new Error(`Organization ${organization} not found or not accessible`);
      }
      
      // Create the project
      const createQuery = `
        mutation CreateProject($ownerId: ID!, $title: String!) {
          createProjectV2(
            input: {
              ownerId: $ownerId,
              title: $title
            }
          ) {
            projectV2 {
              id
              title
              number
              shortDescription
              url
              createdAt
            }
          }
        }
      `;
      
      const createVariables = {
        ownerId: orgResult.data.organization.id,
        title
      };
      
      const createResult = await executeGraphQLQuery(createQuery, createVariables, config.githubToken);
      
      if (!createResult.data || !createResult.data.createProjectV2 || !createResult.data.createProjectV2.projectV2) {
        throw new Error('Failed to create project');
      }
      
      const project = createResult.data.createProjectV2.projectV2;
      
      // Emit SSE event for project creation
      sseEmitter.emitProjectCreated(project);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(project, null, 2)
          }
        ],
        project: project
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add createProjectItem tool
server.tool(
  'createProjectItem',
  {
    projectId: z.string().describe('Project ID'),
    title: z.string().describe('Item title'),
    body: z.string().optional().describe('Item body/description')
  },
  async ({ projectId, title, body }) => {
    try {
      // Create a draft issue in the project
      const createQuery = `
        mutation CreateDraftIssue($projectId: ID!, $title: String!, $body: String) {
          addProjectV2DraftIssue(
            input: {
              projectId: $projectId,
              title: $title,
              body: $body
            }
          ) {
            projectItem {
              id
              databaseId
              type
              content {
                ... on DraftIssue {
                  id
                  title
                  body
                }
              }
            }
          }
        }
      `;
      
      const variables = { 
        projectId,
        title,
        body: body || ""
      };
      
      const result = await executeGraphQLQuery(createQuery, variables, config.githubToken);
      
      if (!result.data || !result.data.addProjectV2DraftIssue || !result.data.addProjectV2DraftIssue.projectItem) {
        throw new Error('Failed to create project item');
      }
      
      const item = result.data.addProjectV2DraftIssue.projectItem;
      
      // Emit SSE event for item creation
      sseEmitter.emitProjectItemAdded(item, projectId);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(item, null, 2)
          }
        ],
        item: item
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add getProjectItems tool
server.tool(
  'getProjectItems',
  {
    projectId: z.string().describe('Project ID'),
    limit: z.number().optional().default(20).describe('Maximum number of items to return')
  },
  async ({ projectId, limit }) => {
    try {
      // GraphQL query to get project items
      const query = `
        query GetProjectItems($projectId: ID!, $first: Int!) {
          node(id: $projectId) {
            ... on ProjectV2 {
              items(first: $first) {
                nodes {
                  id
                  content {
                    ... on Issue {
                      id
                      title
                      number
                      url
                    }
                    ... on PullRequest {
                      id
                      title
                      number
                      url
                    }
                    ... on DraftIssue {
                      id
                      title
                      body
                    }
                  }
                }
              }
            }
          }
        }
      `;
      
      const variables = { projectId, first: limit };
      const result = await executeGraphQLQuery(query, variables, config.githubToken);
      
      if (!result.data || !result.data.node) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
      
      const items = result.data.node.items.nodes;
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(items, null, 2)
          }
        ],
        items: items
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add executeGraphQL tool
server.tool(
  'executeGraphQL',
  {
    query: z.string().describe('GraphQL query'),
    variables: z.record(z.any()).optional().describe('Query variables')
  },
  async ({ query, variables }) => {
    try {
      const result = await executeGraphQLQuery(query, variables || {}, config.githubToken);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result.data, null, 2)
          }
        ],
        response: result.data
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add editProject tool
server.tool(
  'editProject',
  {
    projectId: z.string().describe('ID of the project to edit'),
    title: z.string().optional().describe('New title for the project'),
    description: z.string().optional().describe('New description for the project'),
    public: z.boolean().optional().describe('Whether the project should be public')
  },
  async ({ projectId, title, description, public: isPublic }) => {
    try {
      const updatedProject = await projectEditService.editProject(projectId, {
        title,
        description,
        public: isPublic
      });
      
      // Emit SSE event for project update
      sseEmitter.emitProjectUpdated(updatedProject);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(updatedProject, null, 2)
          }
        ],
        project: updatedProject
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add deleteProject tool
server.tool(
  'deleteProject',
  {
    projectId: z.string().describe('ID of the project to delete')
  },
  async ({ projectId }) => {
    try {
      const result = await projectDeleteService.deleteProject(projectId);
      
      // Emit SSE event for project deletion
      sseEmitter.emitProjectDeleted(projectId);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add editProjectItem tool
server.tool(
  'editProjectItem',
  {
    itemId: z.string().describe('ID of the item to edit'),
    title: z.string().optional().describe('New title for the item'),
    body: z.string().optional().describe('New body content for the item')
  },
  async ({ itemId, title, body }) => {
    try {
      const updatedItem = await projectEditService.editProjectItem(itemId, {
        title,
        body
      });
      
      // Emit SSE event for item update
      sseEmitter.emitProjectItemUpdated(updatedItem);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(updatedItem, null, 2)
          }
        ],
        item: updatedItem
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add deleteProjectItem tool
server.tool(
  'deleteProjectItem',
  {
    itemId: z.string().describe('ID of the item to delete'),
    projectId: z.string().describe('ID of the project containing the item')
  },
  async ({ itemId, projectId }) => {
    try {
      const result = await projectDeleteService.deleteProjectItem(itemId, projectId);
      
      // Emit SSE event for project item deletion
      sseEmitter.emitProjectItemDeleted(itemId, projectId);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add createSubIssue tool
server.tool(
  'createSubIssue',
  {
    repositoryId: z.string().describe('Repository ID'),
    title: z.string().describe('Issue title'),
    body: z.string().optional().describe('Issue body'),
    parentIssueUrl: z.string().optional().describe('URL of the parent issue')
  },
  async ({ repositoryId, title, body, parentIssueUrl }) => {
    try {
      const issue = await githubIssueService.createSubIssue(
        repositoryId,
        title,
        body || '',
        parentIssueUrl
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(issue, null, 2)
          }
        ],
        issue
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add updateProjectFieldValue tool
server.tool(
  'updateProjectFieldValue',
  {
    itemId: z.string().describe('Project item ID'),
    fieldId: z.string().describe('Field ID'),
    value: z.string().describe('New value')
  },
  async ({ itemId, fieldId, value }) => {
    try {
      // Initialize the project field service if not already done
      const projectFieldService = require('./services/project-field-service');
      
      const result = await projectFieldService.updateProjectFieldValue(
        itemId,
        fieldId,
        value
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add addItemToProject tool
server.tool(
  'addItemToProject',
  {
    projectId: z.string().describe('Project ID'),
    contentId: z.string().describe('Issue or PR ID')
  },
  async ({ projectId, contentId }) => {
    try {
      const item = await githubProjectService.addItemToProject(projectId, contentId);
      
      // Emit SSE event for item addition
      sseEmitter.emitProjectItemAdded(item, projectId);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(item, null, 2)
          }
        ],
        item
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add createIssue tool
server.tool(
  'createIssue',
  {
    repositoryOwner: z.string().describe('Repository owner'),
    repositoryName: z.string().describe('Repository name'),
    title: z.string().describe('Issue title'),
    body: z.string().optional().describe('Issue body')
  },
  async ({ repositoryOwner, repositoryName, title, body }) => {
    try {
      // First get the repository ID
      const repositoryId = await githubIssueService.getRepositoryId(repositoryOwner, repositoryName);
      
      // Create the issue
      const issue = await githubIssueService.createIssue(
        repositoryId,
        title,
        body || ''
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(issue, null, 2)
          }
        ],
        issue
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add getRepositoryId tool
server.tool(
  'getRepositoryId',
  {
    owner: z.string().describe('Repository owner'),
    name: z.string().describe('Repository name')
  },
  async ({ owner, name }) => {
    try {
      const repositoryId = await githubProjectService.getRepositoryId(owner, name);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ id: repositoryId }, null, 2)
          }
        ],
        repositoryId
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add SSH authentication tools

// Add addSSHKeyToAgent tool
server.tool(
  'addSSHKeyToAgent',
  {},
  async () => {
    try {
      const result = await sshAuthService.addSSHKeyToAgent();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add generateSSHKey tool
server.tool(
  'generateSSHKey',
  {
    email: z.string().describe('Email to associate with the key')
  },
  async ({ email }) => {
    try {
      const result = await sshAuthService.generateSSHKey(email);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add updatePackageJsonRepos tool
server.tool(
  'updatePackageJsonRepos',
  {
    packageJsonPath: z.string().describe('Path to package.json file')
  },
  async ({ packageJsonPath }) => {
    try {
      const result = await sshAuthService.updatePackageJsonRepos(packageJsonPath);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add testGitHubConnection tool
server.tool(
  'testGitHubConnection',
  {},
  async () => {
    try {
      const result = await sshAuthService.testGitHubConnection();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add setupCodespacesAuth tool
server.tool(
  'setupCodespacesAuth',
  {},
  async () => {
    try {
      const result = await sshAuthService.setupCodespacesAuth();
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add createCommitStatus tool
server.tool(
  'createCommitStatus',
  {
    owner: z.string().describe('Repository owner'),
    repo: z.string().describe('Repository name'),
    sha: z.string().describe('Commit SHA'),
    state: z.enum(['success', 'error', 'failure', 'pending']).describe('Status state'),
    description: z.string().optional().describe('Status description'),
    targetUrl: z.string().optional().describe('URL to link with this status'),
    context: z.string().optional().default('default').describe('Context for this status')
  },
  async ({ owner, repo, sha, state, description, targetUrl, context }) => {
    try {
      const result = await githubStatusService.createCommitStatus(
        owner,
        repo,
        sha,
        state,
        description || '',
        targetUrl || '',
        context || 'default'
      );
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        status: result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add getCommitStatuses tool
server.tool(
  'getCommitStatuses',
  {
    owner: z.string().describe('Repository owner'),
    repo: z.string().describe('Repository name'),
    sha: z.string().describe('Commit SHA')
  },
  async ({ owner, repo, sha }) => {
    try {
      const statuses = await githubStatusService.getCommitStatuses(owner, repo, sha);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(statuses, null, 2)
          }
        ],
        statuses
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add getCombinedStatus tool
server.tool(
  'getCombinedStatus',
  {
    owner: z.string().describe('Repository owner'),
    repo: z.string().describe('Repository name'),
    sha: z.string().describe('Commit SHA')
  },
  async ({ owner, repo, sha }) => {
    try {
      const status = await githubStatusService.getCombinedStatus(owner, repo, sha);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(status, null, 2)
          }
        ],
        status
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

// Create Express app
const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  
  next();
});

// Add body parsing middleware
app.use(express.json());

// Set up MCP discovery endpoint
app.get('/.well-known/mcp.json', (req, res) => {
  const discovery = {
    version: "2025-03-26",
    name: "github-projects-mcp",
    description: "GitHub Projects API with GraphQL and REST support",
    vendor: "Edge Agents",
    contact: {
      name: "Edge Agents Team",
      url: "https://github.com/agenticsorg/edge-agents"
    },
    authentication: {
      type: "none"
    },
    capabilities: {
      tools: {
        getRepository: {
          description: "Get repository information from GitHub"
        },
        listProjects: {
          description: "List GitHub Projects v2 for an organization"
        },
        getProject: {
          description: "Get detailed information about a GitHub Project"
        },
        createProject: {
          description: "Create a new GitHub Project in an organization"
        },
        createProjectItem: {
          description: "Create a new item in a GitHub Project"
        },
        getProjectItems: {
          description: "Get items from a GitHub Project"
        },
        executeGraphQL: {
          description: "Execute a custom GraphQL query against the GitHub API"
        },
        editProject: {
          description: "Edit an existing GitHub Project"
        },
        deleteProject: {
          description: "Delete a GitHub Project"
        },
        editProjectItem: {
          description: "Edit an item in a GitHub Project"
        },
        deleteProjectItem: {
          description: "Delete an item from a GitHub Project"
        },
        createSubIssue: {
          description: "Create a sub-issue linked to a parent issue"
        },
        updateProjectFieldValue: {
          description: "Update a field value for a project item"
        },
        addItemToProject: {
          description: "Add an existing issue or PR to a project"
        },
        createIssue: {
          description: "Create a new issue in a repository"
        },
        getRepositoryId: {
          description: "Get the ID of a repository"
        },
        addSSHKeyToAgent: {
          description: "Add SSH key to the SSH agent"
        },
        generateSSHKey: {
          description: "Generate a new SSH key"
        },
        updatePackageJsonRepos: {
          description: "Update package.json repositories"
        },
        testGitHubConnection: {
          description: "Test GitHub connection"
        },
        setupCodespacesAuth: {
          description: "Set up authentication for GitHub Codespaces"
        },
        createCommitStatus: {
          description: "Create a commit status"
        },
        getCommitStatuses: {
          description: "Get statuses for a commit"
        },
        getCombinedStatus: {
          description: "Get combined status for a commit"
        }
      }
    }
  };
  
  res.json(discovery);
});

// Set up SSE endpoint
const transports = {};
const sseClients = new Set();

app.get('/sse', async (req, res) => {
  console.log('SSE connection established');
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // Disable Nginx buffering
  });
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connection_established', message: 'Connected to GitHub Projects SSE' })}\n\n`);
  
  // Add client to the set of connected clients
  sseClients.add(res);
  
  // Set up MCP transport if needed
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  
  // Handle client disconnect
  res.on('close', () => {
    console.log(`SSE connection closed: ${transport.sessionId}`);
    sseClients.delete(res);
    delete transports[transport.sessionId];
  });
  
  // Connect to MCP server
  await server.connect(transport);
});

// Set up event listeners for SSE events
const eventTypes = [
  'project_created',
  'project_updated',
  'project_deleted',
  'project_item_added',
  'project_item_updated',
  'project_item_deleted'
];

eventTypes.forEach(eventType => {
  sseEmitter.on(eventType, (data) => {
    const eventData = JSON.stringify(data);
    sseClients.forEach(client => {
      try {
        client.write(`event: ${eventType}\n`);
        client.write(`data: ${eventData}\n\n`);
      } catch (error) {
        console.error(`Error sending SSE event to client: ${error.message}`);
      }
    });
  });
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

// Helper endpoint to manually trigger events (for testing)
app.post('/test-sse-event', (req, res) => {
  const { eventType, data } = req.body;
  
  if (!eventType || !data) {
    return res.status(400).json({ error: 'Event type and data are required' });
  }
  
  if (eventType === 'project_created') {
    sseEmitter.emitProjectCreated(data);
  } else if (eventType === 'project_updated') {
    sseEmitter.emitProjectUpdated(data);
  } else if (eventType === 'project_deleted') {
    sseEmitter.emitProjectDeleted(data.projectId);
  } else if (eventType === 'project_item_added') {
    sseEmitter.emitProjectItemAdded(data.item, data.projectId);
  } else if (eventType === 'project_item_updated') {
    sseEmitter.emitProjectItemUpdated(data.item);
  } else if (eventType === 'project_item_deleted') {
    sseEmitter.emitProjectItemDeleted(data.itemId, data.projectId);
  } else {
    return res.status(400).json({ error: 'Invalid event type' });
  }
  
  res.json({ success: true, message: `Event ${eventType} emitted successfully` });
});

// Add direct tool endpoints for compatibility with the previous implementation
app.get('/tools/list', (req, res) => {
  const tools = [
    {
      name: "getRepository",
      description: "Get repository information",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" }
        },
        required: ["owner", "repo"]
      }
    },
    {
      name: "listProjects",
      description: "List projects for an organization",
      inputSchema: {
        type: "object",
        properties: {
          organization: { type: "string" },
          limit: { type: "number", default: 10 }
        },
        required: ["organization"]
      }
    },
    {
      name: "getProject",
      description: "Get project details",
      inputSchema: {
        type: "object",
        properties: {
          organization: { type: "string" },
          projectNumber: { type: "number" }
        },
        required: ["organization", "projectNumber"]
      }
    },
    {
      name: "createProject",
      description: "Create a new GitHub Project in an organization",
      inputSchema: {
        type: "object",
        properties: {
          organization: { type: "string" },
          title: { type: "string" }
        },
        required: ["organization", "title"]
      }
    },
    {
      name: "createProjectItem",
      description: "Create a new item in a GitHub Project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          title: { type: "string" },
          body: { type: "string" }
        },
        required: ["projectId", "title"]
      }
    },
    {
      name: "getProjectItems",
      description: "Get items from a GitHub Project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          limit: { type: "number", default: 20 }
        },
        required: ["projectId"]
      }
    },
    {
      name: "executeGraphQL",
      description: "Execute a GraphQL query against the GitHub API",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          variables: { type: "object" }
        },
        required: ["query"]
      }
    },
    {
      name: "editProject",
      description: "Edit an existing GitHub Project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          title: { type: "string" },
          description: { type: "string" },
          public: { type: "boolean" }
        },
        required: ["projectId"]
      }
    },
    {
      name: "deleteProject",
      description: "Delete a GitHub Project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string" }
        },
        required: ["projectId"]
      }
    },
    {
      name: "editProjectItem",
      description: "Edit an item in a GitHub Project",
      inputSchema: {
        type: "object",
        properties: {
          itemId: { type: "string" },
          title: { type: "string" },
          body: { type: "string" }
        },
        required: ["itemId"]
      }
    },
    {
      name: "deleteProjectItem",
      description: "Delete an item from a GitHub Project",
      inputSchema: {
        type: "object",
        properties: {
          itemId: { type: "string" },
          projectId: { type: "string" }
        },
        required: ["itemId", "projectId"]
      }
    }
  ];
  
  res.json({ tools });
});

app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Tool name is required' });
      return;
    }
    
    let result;
    
    // Call the appropriate tool handler directly
    if (name === 'getRepository') {
      result = await server.tool('getRepository', args);
    } else if (name === 'listProjects') {
      result = await server.tool('listProjects', args);
    } else if (name === 'getProject') {
      result = await server.tool('getProject', args);
    } else if (name === 'createProject') {
      result = await server.tool('createProject', args);
    } else if (name === 'createProjectItem') {
      result = await server.tool('createProjectItem', args);
    } else if (name === 'getProjectItems') {
      result = await server.tool('getProjectItems', args);
    } else if (name === 'executeGraphQL') {
      result = await server.tool('executeGraphQL', args);
    } else if (name === 'editProject') {
      result = await server.tool('editProject', args);
    } else if (name === 'deleteProject') {
      result = await server.tool('deleteProject', args);
    } else if (name === 'editProjectItem') {
      result = await server.tool('editProjectItem', args);
    } else if (name === 'deleteProjectItem') {
      result = await server.tool('deleteProjectItem', args);
    } else if (name === 'createSubIssue') {
      result = await server.tool('createSubIssue', args);
    } else if (name === 'updateProjectFieldValue') {
      result = await server.tool('updateProjectFieldValue', args);
    } else if (name === 'addItemToProject') {
      result = await server.tool('addItemToProject', args);
    } else if (name === 'createIssue') {
      result = await server.tool('createIssue', args);
    } else if (name === 'getRepositoryId') {
      result = await server.tool('getRepositoryId', args);
    } else if (name === 'addSSHKeyToAgent') {
      result = await server.tool('addSSHKeyToAgent', args);
    } else if (name === 'generateSSHKey') {
      result = await server.tool('generateSSHKey', args);
    } else if (name === 'updatePackageJsonRepos') {
      result = await server.tool('updatePackageJsonRepos', args);
    } else if (name === 'testGitHubConnection') {
      result = await server.tool('testGitHubConnection', args);
    } else if (name === 'setupCodespacesAuth') {
      result = await server.tool('setupCodespacesAuth', args);
    } else if (name === 'createCommitStatus') {
      result = await server.tool('createCommitStatus', args);
    } else if (name === 'getCommitStatuses') {
      result = await server.tool('getCommitStatuses', args);
    } else if (name === 'getCombinedStatus') {
      result = await server.tool('getCombinedStatus', args);
    } else {
      res.status(404).json({ error: `Tool '${name}' not found` });
      return;
    }
    
    res.json({
      content: [
        {
          type: "text",
          text: JSON.stringify(result)
        }
      ]
    });
  } catch (error) {
    res.status(400).json({ error: `Error executing tool: ${error.message}` });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`GitHub Projects MCP server running at http://localhost:${PORT}`);
  console.log(`MCP Discovery endpoint: http://localhost:${PORT}/.well-known/mcp.json`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Direct tools endpoint: http://localhost:${PORT}/tools/call`);
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down MCP server...');
  process.exit(0);
});
