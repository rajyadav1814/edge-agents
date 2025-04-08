/**
 * Integration tests for GitHub Projects API endpoints
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
  mockGetProjectResponse, 
  mockGetProjectItemsResponse, 
  mockAddItemToProjectResponse, 
  mockUpdateProjectItemFieldResponse, 
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

Deno.test("Projects API - List projects endpoint", async () => {
  // Mock fetch to return a successful response
  globalThis.fetch = mockFetch(mockListProjectsResponse, {
    status: 200,
    headers: mockRateLimitHeaders
  });

  // Create a mock request
  const req = createMockRequest("GET", "/github-api/projects");
  
  // Call the handler directly
  const response = await handleRequest(req);
  
  // Verify the response
  assertEquals(response.status, 200);
  
  const responseData = await response.json();
  assertEquals(responseData.data.length, 2);
  assertEquals(responseData.data[0].title, "Project 1");
  assertEquals(responseData.data[1].title, "Project 2");
  
  // Verify metadata
  assertEquals(responseData.metadata.rateLimit.limit, 5000);
  assertEquals(responseData.metadata.rateLimit.remaining, 4999);
});

Deno.test("Projects API - Get project details endpoint", async () => {
  // Mock fetch to return a successful response
  globalThis.fetch = mockFetch(mockGetProjectResponse, {
    status: 200,
    headers: mockRateLimitHeaders
  });

  // Create a mock request
  const req = createMockRequest("GET", "/github-api/projects/123");
  
  // Call the handler directly
  const response = await handleRequest(req);
  
  // Verify the response
  assertEquals(response.status, 200);
  
  const responseData = await response.json();
  assertEquals(responseData.data.title, "Project 1");
  assertEquals(responseData.data.number, 123);
  assertEquals(responseData.data.items.length, 2);
});

Deno.test("Projects API - Add item to project endpoint", async () => {
  // Mock fetch to return a successful response
  globalThis.fetch = mockFetch(mockAddItemToProjectResponse, {
    status: 200,
    headers: mockRateLimitHeaders
  });

  // Create a mock request with body
  const req = createMockRequest(
    "POST", 
    "/github-api/projects/123/items", 
    { contentId: "MDExOlB1bGxSZXF1ZXN0MQ==" }
  );
  
  // Call the handler directly
  const response = await handleRequest(req);
  
  // Verify the response
  assertEquals(response.status, 200);
  
  const responseData = await response.json();
  assertEquals(responseData.data.addProjectItem.item.id, "PVTI_lADOAB7P4AACzgA");
});

Deno.test("Projects API - Error handling for invalid project number", async () => {
  // Mock fetch to return an error response
  globalThis.fetch = mockFetch({ 
    errors: [{ message: "Could not resolve to a Project with the number of 999." }] 
  }, {
    status: 200, // GraphQL returns 200 even for errors
    headers: mockRateLimitHeaders
  });

  // Create a mock request
  const req = createMockRequest("GET", "/github-api/projects/999");
  
  // Call the handler directly
  const response = await handleRequest(req);
  
  // Verify the response
  assertEquals(response.status, 404);
  
  const responseData = await response.json();
  assertStringIncludes(responseData.error.message, "Could not resolve to a Project");
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