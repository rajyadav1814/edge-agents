/**
 * Integration tests for the GraphQL endpoint
 */

import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { 
  createMockConfig, 
  createMockRequest, 
  createMockResponse, 
  mockFetch, 
  mockDenoEnv 
} from "../mocks/test-utils.ts";
import { 
  mockListProjectsResponse, 
  mockGraphQLErrorResponse, 
  mockRateLimitHeaders 
} from "../mocks/github-responses.ts";

// Import the handler function from index-test.ts
import { handleRequest } from "../../index-test.ts";

// Setup environment for tests
const mockEnv = {
  GITHUB_TOKEN: "mock-github-token",
  GITHUB_ORG: "mock-org",
  GITHUB_API_VERSION: "v3",
  CACHE_TTL: "300"
};

Deno.test("GraphQL endpoint - successful query", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  const mockResponse = createMockResponse(200, mockListProjectsResponse, mockRateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act
    const request = createMockRequest(
      "POST", 
      "/github-api/graphql", 
      {
        query: `query { 
          organization(login: "mock-org") { 
            projectsV2(first: 10) { 
              nodes { 
                id 
                title 
              } 
            } 
          } 
        }`,
        variables: { foo: "bar" }
      }
    );
    const response = await handleRequest(request);
    
    // Assert
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Content-Type"), "application/json");
    
    const body = await response.json();
    assertEquals(body.data.organization.projectsV2.nodes.length, 2);
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("GraphQL endpoint - handles GraphQL errors", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  const mockResponse = createMockResponse(200, mockGraphQLErrorResponse, mockRateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act
    const request = createMockRequest(
      "POST", 
      "/github-api/graphql", 
      {
        query: `query { 
          organization(login: "invalid-org") { 
            projectsV2(first: 10) { 
              nodes { 
                id 
                title 
              } 
            } 
          } 
        }`
      }
    );
    const response = await handleRequest(request);
    
    // Assert
    assertEquals(response.status, 400);
    
    const body = await response.json();
    assertStringIncludes(body.error, "GraphQL Error");
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("GraphQL endpoint - rejects non-POST requests", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  
  try {
    // Act
    const request = createMockRequest("GET", "/github-api/graphql");
    const response = await handleRequest(request);
    
    // Assert
    assertEquals(response.status, 405);
    
    const body = await response.json();
    assertStringIncludes(body.error, "GraphQL endpoint requires POST method");
  } finally {
    restoreEnv();
  }
});

Deno.test("GraphQL endpoint - requires query field", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  
  try {
    // Act
    const request = createMockRequest(
      "POST", 
      "/github-api/graphql", 
      { variables: { foo: "bar" } } // Missing query field
    );
    const response = await handleRequest(request);
    
    // Assert
    assertEquals(response.status, 400);
    
    const body = await response.json();
    assertStringIncludes(body.error, "Missing required \"query\" field");
  } finally {
    restoreEnv();
  }
});

Deno.test("GraphQL endpoint - handles invalid JSON", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  
  try {
    // Act
    const request = new Request("https://example.com/github-api/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{ invalid json }"
    });
    
    const response = await handleRequest(request);
    
    // Assert
    assertEquals(response.status, 400);
    
    const body = await response.json();
    assertStringIncludes(body.error, "Invalid JSON in request body");
  } finally {
    restoreEnv();
  }
});

Deno.test("GraphQL endpoint - handles network errors", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  
  // Mock fetch to throw an error
  // @ts-ignore - Mocking global fetch
  globalThis.fetch = async (): Promise<Response> => {
    throw new Error("Network error");
  };
  
  try {
    // Act
    const request = createMockRequest(
      "POST", 
      "/github-api/graphql", 
      {
        query: `query { 
          organization(login: "mock-org") { 
            projectsV2(first: 10) { 
              nodes { 
                id 
                title 
              } 
            } 
          } 
        }`
      }
    );
    const response = await handleRequest(request);
    
    // Assert
    assertEquals(response.status, 500);
    
    const body = await response.json();
    assertStringIncludes(body.error, "Failed to execute GraphQL query");
  } finally {
    // @ts-ignore - Restore global fetch
    globalThis.fetch = fetch;
    restoreEnv();
  }
});

Deno.test("GraphQL endpoint - handles CORS preflight requests", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  
  try {
    // Act
    const request = createMockRequest("OPTIONS", "/github-api/graphql");
    const response = await handleRequest(request);
    
    // Assert
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
    assertEquals(response.headers.get("Access-Control-Allow-Methods"), "GET, POST, OPTIONS");
    
    const text = await response.text();
    assertEquals(text, "ok");
  } finally {
    restoreEnv();
  }
});