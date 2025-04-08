/**
 * GraphQL query execution service for GitHub API integration
 * Handles GraphQL queries to the GitHub GraphQL API
 */

import { GitHubError, extractGitHubError } from "../utils/error-handler.ts";
import { EnvConfig } from "../utils/env-validator.ts";

export interface GraphQLRequest {
  query: string;
  variables?: Record<string, unknown>;
  operationName?: string;
}

export interface GraphQLResponse<T = unknown> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
    extensions?: Record<string, unknown>;
  }>;
}

/**
 * Executes a GraphQL query against the GitHub GraphQL API
 * @param request GraphQL request object containing query and variables
 * @param config Environment configuration
 * @returns GraphQL response data
 * @throws GitHubError if the request fails
 */
export async function executeGraphQLQuery<T = unknown>(
  request: GraphQLRequest,
  config: EnvConfig
): Promise<GraphQLResponse<T>> {
  const { githubToken } = config;
  
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${githubToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Agentics-Supabase-Edge-Function',
        'Accept': 'application/vnd.github.v4+json'
      },
      body: JSON.stringify(request)
    });

    const data = await response.json();

    if (!response.ok) {
      // For rate limiting, we need to handle it specially
      if (response.status === 403 && parseInt(response.headers.get("X-RateLimit-Remaining") || "1") === 0) {
        throw new GitHubError(
          `GitHub API error: API rate limit exceeded`,
          403,
          { rateLimit: {
            limit: parseInt(response.headers.get("X-RateLimit-Limit") || "0"),
            remaining: 0,
            reset: parseInt(response.headers.get("X-RateLimit-Reset") || "0")
          }}
        );
      }
      throw await extractGitHubError(response, data);
    }

    // Check for GraphQL-specific errors
    if (data.errors && data.errors.length > 0) {
      const errorMessages = data.errors.map((e: any) => e.message).join('; ');
      throw new GitHubError(
        `GraphQL Error: ${errorMessages}`,
        400,
        data.errors
      );
    }

    return data as GraphQLResponse<T>;
  } catch (error) {
    // If it's already a GitHubError, just rethrow it
    if (error instanceof GitHubError) {
      throw error;
    }
    
    // Otherwise, wrap it in a GitHubError
    throw new GitHubError(
      `Failed to execute GraphQL query: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

/**
 * Executes a GitHub Projects GraphQL query
 * @param query GraphQL query string
 * @param variables Query variables
 * @param config Environment configuration
 * @returns Query response data
 */
export async function executeProjectsQuery<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {},
  config: EnvConfig
): Promise<T> {
  const response = await executeGraphQLQuery<T>(
    { query, variables },
    config
  );
  
  if (!response.data) {
    throw new GitHubError(
      'GraphQL query returned no data',
      500,
      response.errors
    );
  }
  
  return response.data;
}

/**
 * Common GraphQL queries for GitHub Projects
 */
export const ProjectQueries = {
  /**
   * Get a list of projects for an organization
   */
  listProjects: `
    query ListProjects($org: String!, $first: Int!) {
      organization(login: $org) {
        projectsV2(first: $first) {
          nodes {
            id
            title
            shortDescription
            url
            closed
            createdAt
            updatedAt
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    }
  `,

  /**
   * Get a single project by number
   */
  getProject: `
    query GetProject($org: String!, $number: Int!) {
      organization(login: $org) {
        projectV2(number: $number) {
          id
          title
          shortDescription
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
                    duration
                  }
                }
              }
              ... on ProjectV2SingleSelectField {
                id
                name
                options {
                  id
                  name
                  color
                }
              }
            }
          }
        }
      }
    }
  `,

  /**
   * Get items in a project
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
                  state
                  repository {
                    name
                  }
                }
                ... on PullRequest {
                  id
                  title
                  number
                  state
                  repository {
                    name
                  }
                }
                ... on DraftIssue {
                  id
                  title
                }
              }
              fieldValues(first: 20) {
                nodes {
                  ... on ProjectV2ItemFieldTextValue {
                    text
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldDateValue {
                    date
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2FieldCommon {
                        name
                      }
                    }
                  }
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
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
      addProjectV2ItemById(input: {
        projectId: $projectId
        contentId: $contentId
      }) {
        item {
          id
        }
      }
    }
  `,

  /**
   * Update a field value for a project item
   */
  updateProjectItemField: `
    mutation UpdateProjectItemField(
      $projectId: ID!,
      $itemId: ID!,
      $fieldId: ID!,
      $value: String!
    ) {
      updateProjectV2ItemFieldValue(input: {
        projectId: $projectId
        itemId: $itemId
        fieldId: $fieldId
        value: $value
      }) {
        projectV2Item {
          id
        }
      }
    }
  `
};