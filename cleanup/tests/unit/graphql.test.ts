/**
 * Unit tests for the GraphQL query execution service
 */

import { assertEquals, assertRejects } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { 
  executeGraphQLQuery, 
  executeProjectsQuery, 
  ProjectQueries 
} from "../../services/graphql.ts";
import { GitHubError } from "../../utils/error-handler.ts";
import { 
  createMockConfig, 
  mockFetch, 
  createMockResponse 
} from "../mocks/test-utils.ts";
import { 
  mockListProjectsResponse, 
  mockGraphQLErrorResponse, 
  mockRateLimitHeaders 
} from "../mocks/github-responses.ts";

Deno.test("executeGraphQLQuery - successful query", async () => {
  // Arrange
  const config = createMockConfig();
  const mockResponse = createMockResponse(200, mockListProjectsResponse, mockRateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act
    const result = await executeGraphQLQuery({
      query: "query { viewer { login } }",
      variables: { foo: "bar" }
    }, config);
    
    // Assert
    assertEquals(result, mockListProjectsResponse);
  } finally {
    restoreFetch();
  }
});

Deno.test("executeGraphQLQuery - handles GraphQL errors", async () => {
  // Arrange
  const config = createMockConfig();
  const mockResponse = createMockResponse(200, mockGraphQLErrorResponse, mockRateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act & Assert
    await assertRejects(
      async () => {
        await executeGraphQLQuery({
          query: "query { viewer { login } }"
        }, config);
      },
      GitHubError
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("executeGraphQLQuery - handles network errors", async () => {
  // Arrange
  const config = createMockConfig();
  const restoreFetch = mockFetch(createMockResponse(500, { message: "Internal Server Error" }));
  
  try {
    // Act & Assert
    await assertRejects(
      async () => {
        await executeGraphQLQuery({
          query: "query { viewer { login } }"
        }, config);
      },
      GitHubError
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("executeGraphQLQuery - handles rate limiting", async () => {
  // Arrange
  const config = createMockConfig();
  const rateLimitHeaders = {
    "X-RateLimit-Limit": "5000",
    "X-RateLimit-Remaining": "0",
    "X-RateLimit-Reset": String(Math.floor(Date.now() / 1000) + 3600)
  };
  const mockResponse = createMockResponse(403, { message: "API rate limit exceeded" }, rateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act & Assert
    await assertRejects(
      async () => {
        await executeGraphQLQuery({
          query: "query { viewer { login } }"
        }, config);
      },
      GitHubError
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("executeProjectsQuery - successful query", async () => {
  // Arrange
  const config = createMockConfig();
  const mockResponse = createMockResponse(200, mockListProjectsResponse, mockRateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act
    const result = await executeProjectsQuery(
      ProjectQueries.listProjects,
      { org: "mock-org", first: 10 },
      config
    );
    
    // Assert
    assertEquals(result, mockListProjectsResponse.data);
  } finally {
    restoreFetch();
  }
});

Deno.test("executeProjectsQuery - handles empty data", async () => {
  // Arrange
  const config = createMockConfig();
  const mockResponse = createMockResponse(200, { errors: null }, mockRateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act & Assert
    await assertRejects(
      async () => {
        await executeProjectsQuery(
          ProjectQueries.listProjects,
          { org: "mock-org", first: 10 },
          config
        );
      },
      GitHubError,
      "GraphQL query returned no data"
    );
  } finally {
    restoreFetch();
  }
});

Deno.test("ProjectQueries - contains all required queries", () => {
  // Assert
  assertEquals(typeof ProjectQueries.listProjects, "string");
  assertEquals(typeof ProjectQueries.getProject, "string");
  assertEquals(typeof ProjectQueries.getProjectItems, "string");
  assertEquals(typeof ProjectQueries.addItemToProject, "string");
  assertEquals(typeof ProjectQueries.updateProjectItemField, "string");
  
  // Check that queries contain expected GraphQL operations
  assertEquals(ProjectQueries.listProjects.includes("query ListProjects"), true);
  assertEquals(ProjectQueries.getProject.includes("query GetProject"), true);
  assertEquals(ProjectQueries.getProjectItems.includes("query GetProjectItems"), true);
  assertEquals(ProjectQueries.addItemToProject.includes("mutation AddItemToProject"), true);
  assertEquals(ProjectQueries.updateProjectItemField.includes("mutation UpdateProjectItemField"), true);
});