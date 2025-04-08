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
    
    // Determine which GitHub API to call based on the path
    if (path.startsWith('/github-api/graphql')) {
      // Handle direct GraphQL API requests
      return await handleGraphQLRequest(req);
    } else if (path.startsWith('/github-api/projects')) {
      // Handle Projects API requests (using GraphQL)
      return await handleProjectsRequest(req);
    } else if (path.includes('/readme/')) {
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
  
  // List projects
  if (path.includes('/projects/list')) {
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
 * @returns Response object
 */
async function proxyToGitHubRest(githubApiUrl: string): Promise<Response> {
  console.log(`Proxying request to GitHub REST API: ${githubApiUrl}`);
  
  const response = await fetch(githubApiUrl, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Agentics-Supabase-Edge-Function',
      ...(config.githubToken ? { 'Authorization': `token ${config.githubToken}` } : {})
    }
  });
  
  if (!response.ok) {
    throw new GitHubError(`GitHub API error: ${response.status} ${response.statusText}`, response.status);
  }
  
  const data = await response.json();
  
  return createSuccessResponse(data, response.headers);
}

// Start the server with a different port
serve(handleRequest, { port: 8001 });