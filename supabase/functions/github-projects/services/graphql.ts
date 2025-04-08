/**
 * GraphQL service for GitHub API
 * Provides functions to execute GraphQL queries against the GitHub API
 */

import { GitHubError, handleRateLimitError } from "../utils/error-handler.ts";
import { EnvConfig } from "../utils/env-validator.ts";

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse<T = Record<string, unknown>> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}

/**
 * Executes a GraphQL query against the GitHub API
 * @param request GraphQL request with query and variables
 * @param config Environment configuration
 * @returns GraphQL response data
 * @throws GitHubError if the request fails
 */
export async function executeGraphQLQuery<T = Record<string, unknown>>(
  request: GraphQLRequest,
  config: EnvConfig
): Promise<GraphQLResponse<T>> {
  try {
    // Log the token for debugging (first few characters)
    const tokenPreview = config.githubToken.substring(0, 10) + '...';
    console.log(`Using token: ${tokenPreview}`);
    
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Agentics-Supabase-Edge-Function',
        'Authorization': `token ${config.githubToken}`,
        'X-Github-Next-Global-ID': '1' // Required for Projects V2 API
      },
      body: JSON.stringify(request)
    });

    // Handle rate limiting
    if (response.status === 403 && parseInt(response.headers.get("X-RateLimit-Remaining") || "1") === 0) {
      throw handleRateLimitError(response.headers);
    }

    if (!response.ok) {
      throw new GitHubError(`Failed to execute GraphQL query: ${response.statusText}`, response.status);
    }

    const result = await response.json() as GraphQLResponse<T>;

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map(e => e.message).join(', ');
      throw new GitHubError(`GraphQL Error: ${errorMessages}`, 400, result.errors);
    }

    return result;
  } catch (error) {
    if (error instanceof GitHubError) {
      throw error;
    }
    throw new GitHubError(`Failed to execute GraphQL query: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

/**
 * Executes a GraphQL query for Projects API with type safety
 * @param query GraphQL query string
 * @param variables Query variables
 * @param config Environment configuration
 * @returns Typed query result
 * @throws GitHubError if the request fails or returns no data
 */
export async function executeProjectsQuery<T>(
  query: string,
  variables: Record<string, unknown>,
  config: EnvConfig
): Promise<T> {
  const response = await executeGraphQLQuery<T>({ query, variables }, config);
  
  if (!response.data) {
    throw new GitHubError('GraphQL query returned no data', 500);
  }
  
  return response.data;
}

/**
 * Pre-defined GraphQL queries for GitHub Projects API
 */
export const ProjectQueries = {
  /**
   * List projects for an organization
   */
  listProjects: `
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
  `,

  /**
   * Get project details
   */
  getProject: `
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
  `,

  /**
   * Get project items
   */
  getProjectItems: `
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
                }
              }
            }
          }
        }
      }
    }
  `,

  /**
   * Add an item to a project
   */
  addItemToProject: `
    mutation AddItemToProject($projectId: ID!, $contentId: ID!) {
      addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
        item {
          id
        }
      }
    }
  `,

  /**
   * Update a project item field
   */
  updateProjectItemField: `
    mutation UpdateProjectItemField($projectId: ID!, $itemId: ID!, $fieldId: ID!, $value: String!) {
      updateProjectV2ItemFieldValue(
        input: {
          projectId: $projectId,
          itemId: $itemId,
          fieldId: $fieldId,
          value: $value
        }
      ) {
        projectV2Item {
          id
        }
      }
    }
  `,

  /**
   * Create a new project
   */
  createProject: `
    mutation CreateProject($ownerId: ID!, $title: String!, $shortDescription: String) {
      createProjectV2(
        input: {
          ownerId: $ownerId,
          title: $title,
          shortDescription: $shortDescription
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
  `,

  /**
   * Get organization ID
   */
  getOrganizationId: `
    query GetOrganizationId($login: String!) {
      organization(login: $login) {
        id
      }
    }
  `
};