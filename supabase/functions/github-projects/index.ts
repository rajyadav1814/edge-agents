/**
 * GitHub API Edge Function
 * Provides secure access to GitHub API with authentication
 * Supports both REST and GraphQL APIs
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Import utility modules
import { validateEnv, logEnvStatus, EnvConfig } from "./utils/env-validator.ts";
import { GitHubError, createErrorResponse } from "./utils/error-handler.ts";
import { createSuccessResponse, createEmptyResponse } from "./utils/response-formatter.ts";

// Import GraphQL service
import { 
  executeGraphQLQuery, 
  executeProjectsQuery, 
  ProjectQueries 
} from "./services/graphql.ts";

// Initialize environment configuration
let config: EnvConfig;
try {
  config = validateEnv();
  logEnvStatus(config);
} catch (error) {
  console.error('Environment configuration error:', error);
  // Continue with default values, but log the error
  config = {
    githubToken: Deno.env.get('GITHUB_TOKEN') || '',
    githubOrg: Deno.env.get('GITHUB_ORG') || 'example-org',
    githubApiVersion: 'v3',
    cacheTtl: 60
  };
}

/**
 * Main request handler for the edge function
 * @param req Request object
 * @returns Response object
 */
export async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;
    
    console.log('Request path:', path);
    console.log('Full URL:', req.url);
    
    // Check for MCP discovery endpoint first, before any other routing
    if (path.includes("mcp-discovery")) {
      console.log('Handling MCP discovery request - DIRECT MATCH');
      return handleMcpDiscovery(req);
    }
    
    // Determine which GitHub API to call based on the path
    if (path.includes('/graphql')) {
      // Handle direct GraphQL API requests
      return await handleGraphQLRequest(req);
    } else if (path.includes('/projects')) {
      // Handle Projects API requests (using GraphQL)
      return await handleProjectsRequest(req);
    }
    // Repository endpoints
    else if (path.includes('/repo/')) {
      // Extract repo name from path
      const pathParts = path.split('/repo/');
      if (pathParts.length < 2) {
        throw new GitHubError('Invalid repository path', 400);
      }
      
      const repoPath = pathParts[1];
      
      // Handle specific repository endpoints
      if (path.includes('/contents/')) {
        return await handleRepoContentsRequest(req, repoPath);
      } else if (path.includes('/branches/')) {
        return await handleRepoBranchesRequest(req, repoPath);
      } else if (path.includes('/commits/')) {
        return await handleRepoCommitsRequest(req, repoPath);
      } else if (path.includes('/pulls/')) {
        return await handleRepoPullsRequest(req, repoPath);
      } else if (path.includes('/issues/')) {
        return await handleRepoIssuesRequest(req, repoPath);
      } else if (path.includes('/collaborators/')) {
        return await handleRepoCollaboratorsRequest(repoPath);
      } else {
        // Get repository details
        return await handleRepoDetailsRequest(req, repoPath);
      }
    }
    // User endpoints
    else if (path.includes('/user/')) {
      const username = path.split('/user/')[1].split('/')[0];
      
      if (path.includes('/repos')) {
        return await handleUserReposRequest(username);
      } else if (path.includes('/orgs')) {
        return await handleUserOrgsRequest(username);
      } else {
        return await handleUserProfileRequest(username);
      }
    }
    // Organization endpoints
    else if (path.includes('/org/')) {
      const orgName = path.split('/org/')[1].split('/')[0];
      
      if (path.includes('/members')) {
        return await handleOrgMembersRequest(orgName);
      } else if (path.includes('/teams')) {
        return await handleOrgTeamsRequest(orgName);
      } else {
        return await handleOrgDetailsRequest(orgName);
      }
    }
    else if (path.includes('/readme/')) {
      // Handle readme requests
      const repoName = path.split('/readme/')[1];
      return await handleReadmeRequest(repoName);
    } else {
      // Default: Handle repository list requests
      return await handleRepoListRequest();
    }
  } catch (error) {
    return createErrorResponse(error);
  }
}

/**
 * Handles direct GraphQL API requests
 * @param req Request object
 * @returns Response object
 */
async function handleGraphQLRequest(req: Request): Promise<Response> {
  // Only allow POST requests for GraphQL
  if (req.method !== 'POST') {
    throw new GitHubError('GraphQL endpoint requires POST method', 405);
  }
  
  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    throw new GitHubError('Invalid JSON in request body', 400);
  }
  
  // Validate request body
  if (!body.query) {
    throw new GitHubError('Missing required "query" field', 400);
  }
  
  // Execute GraphQL query
  const result = await executeGraphQLQuery({
    query: body.query,
    variables: body.variables,
    operationName: body.operationName
  }, config);
  
  return createSuccessResponse(result.data);
}

/**
 * Handles GitHub Projects API requests
 * @param req Request object
 * @returns Response object
 */
async function handleProjectsRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const params = url.searchParams;
  
  // Create a new project
  if (path.includes('/projects/create') || (path.endsWith('/projects') && req.method === 'POST')) {
    return await handleCreateProjectRequest(req);
  }
  // List projects
  else if (path.includes('/projects/list')) {
    const owner = params.get('owner') || config.githubOrg;
    const type = params.get('type') || 'organization';
    const first = parseInt(params.get('first') || '20');
    
    if (type === 'organization') {
      const data = await executeProjectsQuery(
        ProjectQueries.listProjects,
        { org: owner, first },
        config
      );
      return createSuccessResponse(data);
    } else {
      throw new GitHubError('User projects are not supported yet', 501);
    }
  } 
  // Get project details
  else if (path.includes('/projects/detail')) {
    const owner = params.get('owner') || config.githubOrg;
    const numberParam = params.get('number');
    
    if (!numberParam) {
      throw new GitHubError('Project number is required', 400);
    }
    
    const number = parseInt(numberParam);
    
    const data = await executeProjectsQuery(
      ProjectQueries.getProject,
      { org: owner, number },
      config
    );
    return createSuccessResponse(data);
  } 
  // Get project items
  else if (path.includes('/projects/items')) {
    const projectId = params.get('projectId');
    const first = parseInt(params.get('first') || '20');
    
    if (!projectId) {
      throw new GitHubError('Project ID is required', 400);
    }
    
    const data = await executeProjectsQuery(
      ProjectQueries.getProjectItems,
      { projectId, first },
      config
    );
    return createSuccessResponse(data);
  } 
  // Add item to project
  else if (path.includes('/projects/add-item')) {
    // Only allow POST for mutations
    if (req.method !== 'POST') {
      throw new GitHubError('Adding items requires a POST request', 405);
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      throw new GitHubError('Invalid JSON in request body', 400);
    }
    
    const projectId = body.projectId;
    const contentId = body.contentId;
    
    if (!projectId || !contentId) {
      throw new GitHubError('Both projectId and contentId are required', 400);
    }
    
    const data = await executeProjectsQuery(
      ProjectQueries.addItemToProject,
      { projectId, contentId },
      config
    );
    return createSuccessResponse(data);
  } 
  // Update project item field
  else if (path.includes('/projects/update-field')) {
    // Only allow POST for mutations
    if (req.method !== 'POST') {
      throw new GitHubError('Updating fields requires a POST request', 405);
    }
    
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (error) {
      throw new GitHubError('Invalid JSON in request body', 400);
    }
    
    const projectId = body.projectId;
    const itemId = body.itemId;
    const fieldId = body.fieldId;
    const value = body.value;
    
    if (!projectId || !itemId || !fieldId || value === undefined) {
      throw new GitHubError('Missing required fields', 400);
    }
    
    const data = await executeProjectsQuery(
      ProjectQueries.updateProjectItemField,
      { projectId, itemId, fieldId, value: JSON.stringify(value) },
      config
    );
    return createSuccessResponse(data);
  } 
  else {
    throw new GitHubError('Unknown Projects API endpoint', 404);
  }
}

/**
 * Handles project creation requests
 * @param req Request object
 * @returns Response object
 */
export async function handleCreateProjectRequest(req: Request): Promise<Response> {
  // Only allow POST for project creation
  if (req.method !== 'POST') {
    throw new GitHubError('Project creation requires a POST request', 405);
  }
  
  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    throw new GitHubError('Invalid JSON in request body', 400);
  }
  
  // Validate request body
  if (!body.title) {
    throw new GitHubError('Project title is required', 400);
  }
  
  // Get organization ID first
  const orgData = await executeProjectsQuery(
    ProjectQueries.getOrganizationId,
    { login: config.githubOrg },
    config
  ) as { organization: { id: string } };
  
  if (!orgData.organization?.id) {
    throw new GitHubError(`Organization ${config.githubOrg} not found or not accessible`, 404);
  }
  
  // Create the project
  const projectData = await executeProjectsQuery(
    ProjectQueries.createProject,
    {
      ownerId: orgData.organization.id,
      title: body.title,
      shortDescription: body.shortDescription || null
    },
    config
  ) as { createProjectV2: { projectV2: Record<string, unknown> } };
  
  // Return the created project
  return new Response(
    JSON.stringify({
      data: projectData.createProjectV2.projectV2,
      meta: {
        timestamp: new Date().toISOString()
      }
    }),
    {
      status: 201,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Handles repository README requests
 * @param repoName Repository name
 * @returns Response object
 */
async function handleReadmeRequest(repoName: string): Promise<Response> {
  const githubApiUrl = `https://api.github.com/repos/${config.githubOrg}/${repoName}/readme`;
  console.log(`Fetching readme for repo: ${repoName}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles repository list requests
 * @returns Response object
 */
async function handleRepoListRequest(): Promise<Response> {
  const githubApiUrl = `https://api.github.com/orgs/${config.githubOrg}/repos`;
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Proxies requests to GitHub REST API
 * @param githubApiUrl GitHub API URL
 * @param method HTTP method (default: GET)
 * @param body Request body for POST/PUT/PATCH requests
 * @returns Response object
 */
async function proxyToGitHubRest(
  githubApiUrl: string,
  method: string = 'GET',
  body?: Record<string, unknown>
): Promise<Response> {
  console.log(`Proxying ${method} request to GitHub REST API: ${githubApiUrl}`);
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'User-Agent': 'Agentics-Supabase-Edge-Function',
    ...(config.githubToken ? { 'Authorization': `token ${config.githubToken}` } : {})
  };
  
  // Add content-type for requests with body
  if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const requestOptions: RequestInit = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  };
  
  const response = await fetch(githubApiUrl, requestOptions);
  
  if (!response.ok) {
    throw new GitHubError(`GitHub API error: ${response.status} ${response.statusText}`, response.status);
  }
  
  // For 204 No Content responses, return empty response
  if (response.status === 204) {
    return createEmptyResponse();
  }
  
  const data = await response.json();
  return createSuccessResponse(data, response.headers);
}

/**
 * Handles repository details requests
 * @param req Request object
 * @param repoPath Repository path or name
 * @returns Response object
 */
async function handleRepoDetailsRequest(req: Request, repoPath: string): Promise<Response> {
  const repoName = repoPath.split('/')[0]; // Extract repo name from path
  const githubApiUrl = `https://api.github.com/repos/${config.githubOrg}/${repoName}`;
  console.log(`Handling repo details for: ${repoName}, method: ${req.method}`);
  
  // Handle different HTTP methods
  if (req.method === 'GET') {
    // Get repository details
    return await proxyToGitHubRest(githubApiUrl);
  } else if (req.method === 'PATCH') {
    // Update repository details
    try {
      const body = await req.json();
      return await proxyToGitHubRest(githubApiUrl, 'PATCH', body);
    } catch (error) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError('Invalid JSON in request body', 400);
    }
  } else if (req.method === 'DELETE') {
    // Delete repository
    return await proxyToGitHubRest(githubApiUrl, 'DELETE');
  } else {
    throw new GitHubError(`Method ${req.method} not supported for repository details endpoint`, 405);
  }
}

/**
 * Handles repository creation requests
 * @param req Request object
 * @returns Response object
 */
async function handleCreateRepoRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    throw new GitHubError('Repository creation requires a POST request', 405);
  }
  
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.name) {
      throw new GitHubError('Repository name is required', 400);
    }
    
    // Create repository in the organization
    const githubApiUrl = `https://api.github.com/orgs/${config.githubOrg}/repos`;
    return await proxyToGitHubRest(githubApiUrl, 'POST', body);
  } catch (error) {
    if (error instanceof GitHubError) {
      throw error;
    }
    throw new GitHubError('Invalid JSON in request body', 400);
  }
}

/**
 * Handles repository contents requests
 * @param req Request object
 * @param repoPath Repository path
 * @returns Response object
 */
async function handleRepoContentsRequest(req: Request, repoPath: string): Promise<Response> {
  const url = new URL(req.url);
  const path = url.searchParams.get('path') || '';
  
  // Extract repo name from path
  const repoName = repoPath.split('/contents/')[0];
  
  const githubApiUrl = `https://api.github.com/repos/${config.githubOrg}/${repoName}/contents/${path}`;
  console.log(`Handling contents for repo: ${repoName}, path: ${path}, method: ${req.method}`);
  
  // Handle different HTTP methods
  if (req.method === 'GET') {
    // Get file or directory contents
    return await proxyToGitHubRest(githubApiUrl);
  } else if (req.method === 'PUT') {
    // Create or update file contents
    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.message || !body.content) {
        throw new GitHubError('Missing required fields: message and content are required', 400);
      }
      
      return await proxyToGitHubRest(githubApiUrl, 'PUT', body);
    } catch (error) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError('Invalid JSON in request body', 400);
    }
  } else if (req.method === 'DELETE') {
    // Delete a file
    try {
      const body = await req.json();
      
      // Validate required fields
      if (!body.message || !body.sha) {
        throw new GitHubError('Missing required fields: message and sha are required for deletion', 400);
      }
      
      return await proxyToGitHubRest(githubApiUrl, 'DELETE', body);
    } catch (error) {
      if (error instanceof GitHubError) {
        throw error;
      }
      throw new GitHubError('Invalid JSON in request body', 400);
    }
  } else {
    throw new GitHubError(`Method ${req.method} not supported for contents endpoint`, 405);
  }
}

/**
 * Handles repository branches requests
 * @param req Request object
 * @param repoPath Repository path
 * @returns Response object
 */
async function handleRepoBranchesRequest(req: Request, repoPath: string): Promise<Response> {
  // Extract repo name from path
  const repoName = repoPath.split('/branches/')[0];
  const url = new URL(req.url);
  const branchName = url.searchParams.get('branch') || '';
  
  let githubApiUrl = `https://api.github.com/repos/${config.githubOrg}/${repoName}/branches`;
  
  // If a specific branch is requested
  if (branchName) {
    githubApiUrl = `${githubApiUrl}/${branchName}`;
    
    // Handle branch protection
    if (url.pathname.includes('/protection')) {
      githubApiUrl = `${githubApiUrl}/protection`;
      
      if (req.method === 'GET') {
        // Get branch protection
        return await proxyToGitHubRest(githubApiUrl);
      } else if (req.method === 'PUT') {
        // Update branch protection
        try {
          const body = await req.json();
          return await proxyToGitHubRest(githubApiUrl, 'PUT', body);
        } catch (error) {
          if (error instanceof GitHubError) {
            throw error;
          }
          throw new GitHubError('Invalid JSON in request body', 400);
        }
      } else if (req.method === 'DELETE') {
        // Remove branch protection
        return await proxyToGitHubRest(githubApiUrl, 'DELETE');
      }
    }
  }
  
  // List branches (default)
  console.log(`Fetching branches for repo: ${repoName}`);
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles repository commits requests
 * @param req Request object
 * @param repoPath Repository path
 * @returns Response object
 */
async function handleRepoCommitsRequest(req: Request, repoPath: string): Promise<Response> {
  const url = new URL(req.url);
  const sha = url.searchParams.get('sha') || '';
  
  // Extract repo name from path
  const repoName = repoPath.split('/commits/')[0];
  
  let githubApiUrl = `https://api.github.com/repos/${config.githubOrg}/${repoName}/commits`;
  if (sha) {
    githubApiUrl = `${githubApiUrl}/${sha}`;
  }
  
  console.log(`Fetching commits for repo: ${repoName}`);
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles repository pull requests
 * @param req Request object
 * @param repoPath Repository path
 * @returns Response object
 */
async function handleRepoPullsRequest(req: Request, repoPath: string): Promise<Response> {
  const url = new URL(req.url);
  const state = url.searchParams.get('state') || 'open';
  
  // Extract repo name from path
  const repoName = repoPath.split('/pulls/')[0];
  
  const githubApiUrl = `https://api.github.com/repos/${config.githubOrg}/${repoName}/pulls?state=${state}`;
  console.log(`Fetching pull requests for repo: ${repoName}, state: ${state}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles repository issues requests
 * @param req Request object
 * @param repoPath Repository path
 * @returns Response object
 */
async function handleRepoIssuesRequest(req: Request, repoPath: string): Promise<Response> {
  const url = new URL(req.url);
  const state = url.searchParams.get('state') || 'open';
  
  // Extract repo name from path
  const repoName = repoPath.split('/issues/')[0];
  
  const githubApiUrl = `https://api.github.com/repos/${config.githubOrg}/${repoName}/issues?state=${state}`;
  console.log(`Fetching issues for repo: ${repoName}, state: ${state}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles repository collaborators requests
 * @param repoPath Repository path
 * @returns Response object
 */
async function handleRepoCollaboratorsRequest(repoPath: string): Promise<Response> {
  // Extract repo name from path
  const repoName = repoPath.split('/collaborators/')[0];
  
  const githubApiUrl = `https://api.github.com/repos/${config.githubOrg}/${repoName}/collaborators`;
  console.log(`Fetching collaborators for repo: ${repoName}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles user profile requests
 * @param username GitHub username
 * @returns Response object
 */
async function handleUserProfileRequest(username: string): Promise<Response> {
  const githubApiUrl = `https://api.github.com/users/${username}`;
  console.log(`Fetching profile for user: ${username}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles user repositories requests
 * @param username GitHub username
 * @returns Response object
 */
async function handleUserReposRequest(username: string): Promise<Response> {
  const githubApiUrl = `https://api.github.com/users/${username}/repos`;
  console.log(`Fetching repositories for user: ${username}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles user organizations requests
 * @param username GitHub username
 * @returns Response object
 */
async function handleUserOrgsRequest(username: string): Promise<Response> {
  const githubApiUrl = `https://api.github.com/users/${username}/orgs`;
  console.log(`Fetching organizations for user: ${username}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles organization details requests
 * @param orgName Organization name
 * @returns Response object
 */
async function handleOrgDetailsRequest(orgName: string): Promise<Response> {
  const githubApiUrl = `https://api.github.com/orgs/${orgName}`;
  console.log(`Fetching details for organization: ${orgName}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles organization members requests
 * @param orgName Organization name
 * @returns Response object
 */
async function handleOrgMembersRequest(orgName: string): Promise<Response> {
  const githubApiUrl = `https://api.github.com/orgs/${orgName}/members`;
  console.log(`Fetching members for organization: ${orgName}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles organization teams requests
 * @param orgName Organization name
 * @returns Response object
 */
async function handleOrgTeamsRequest(orgName: string): Promise<Response> {
  const githubApiUrl = `https://api.github.com/orgs/${orgName}/teams`;
  console.log(`Fetching teams for organization: ${orgName}`);
  
  return await proxyToGitHubRest(githubApiUrl);
}

/**
 * Handles MCP discovery requests - completely isolated function
 * @param req Request object
 * @returns Response object with MCP discovery information
 */
function handleMcpDiscovery(req: Request): Response {
  console.log("MCP Discovery handler called - DIRECT IMPLEMENTATION");
  
  // Hard-coded MCP discovery response to avoid any issues
  const discoveryData = {
    name: "github-projects",
    version: "1.0.0",
    description: "GitHub Projects API with GraphQL and REST support",
    endpoints: {
      graphql: "/github-api/graphql",
      projects: "/github-api/projects",
      repositories: "/github-api/repo"
    },
    capabilities: [
      "github-api-proxy",
      "projects-management",
      "repository-access",
      "mcp-discovery"
    ],
    documentation: "/github-api/docs",
    contact: {
      maintainer: "Agentics Team",
      support: "support@example.com"
    }
  };
  
  console.log("MCP Discovery response:", JSON.stringify(discoveryData, null, 2));
  
  // Return the discovery data as JSON with explicit headers
  return new Response(
    JSON.stringify(discoveryData),
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
      }
    }
  );
}

// Start the server
serve(handleRequest);