/**
 * Integration tests for GraphQL endpoint
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
  mockGraphQLResponse, 
  mockGraphQLErrorResponse, 
  mockRateLimitHeaders 
} from "../mocks/github-responses.ts";

// Instead of mocking serve, we'll directly import and test the handler
import { handleRequest } from "../../../index.ts";

// Setup test environment
const mockEnv = mockDenoEnv({
  GITHUB_TOKEN: "mock-token",
  GITHUB_ORG: "mock-org",
  CACHE_TTL: "60"
});

// Mock fetch for all tests
const originalFetch = globalThis.fetch;

Deno.test("GraphQL endpoint - Successful query", async () => {
  // Mock fetch to return a successful response
  globalThis.fetch = mockFetch(mockGraphQLResponse, {
    status: 200,
    headers: mockRateLimitHeaders
  });

  // Create a mock request with GraphQL query
  const req = createMockRequest(
    "POST", 
    "/github-api/graphql", 
    { 
      query: `query { 
        viewer { 
          login 
        } 
      }` 
    }
  );
  
  // Call the handler directly
  const response = await handleRequest(req);
  
  // Verify the response
  assertEquals(response.status, 200);
  
  const responseData = await response.json();
  assertEquals(responseData.data.viewer.login, "octocat");
  
  // Verify metadata
  assertEquals(responseData.metadata.rateLimit.limit, 5000);
  assertEquals(responseData.metadata.rateLimit.remaining, 4999);
});

Deno.test("GraphQL endpoint - Error handling", async () => {
  // Mock fetch to return an error response
  globalThis.fetch = mockFetch(mockGraphQLErrorResponse, {
    status: 200, // GraphQL returns 200 even for errors
    headers: mockRateLimitHeaders
  });

  // Create a mock request with invalid GraphQL query
  const req = createMockRequest(
    "POST", 
    "/github-api/graphql", 
    { 
      query: `query { 
        invalid { 
          field 
        } 
      }` 
    }
  );
  
  // Call the handler directly
  const response = await handleRequest(req);
  
  // Verify the response
  assertEquals(response.status, 400);
  
  const responseData = await response.json();
  assertStringIncludes(responseData.error.message, "Field 'invalid' doesn't exist");
});

Deno.test("GraphQL endpoint - Method validation", async () => {
  // Create a GET request (should be rejected as only POST is allowed)
  const req = createMockRequest("GET", "/github-api/graphql");
  
  // Call the handler directly
  const response = await handleRequest(req);
  
  // Verify the response
  assertEquals(response.status, 405);
  
  const responseData = await response.json();
  assertStringIncludes(responseData.error.message, "Method not allowed");
});

// Cleanup after all tests
Deno.test({
  name: "Cleanup",
  fn: () => {
    // Restore original fetch
    globalThis.fetch = originalFetch;
    // Restore original environment
    mockEnv.restore();
  },
  sanitizeResources: false,
  sanitizeOps: false
});