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

// Import the handler function from index.ts
// We need to mock the serve function to test the handler directly
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// Create a variable to store the handler function
let requestHandler: (req: Request) => Promise<Response>;

// Mock the serve function to capture the handler
const originalServe = serve;
const mockServe = (handler: (req: Request) => Promise<Response>) => {
  requestHandler = handler;
  return Promise.resolve();
};

// Replace the serve function temporarily
Object.defineProperty(globalThis, "serve", {
  value: mockServe,
  writable: true,
  configurable: true
});

// Import the index file to initialize the handler
await import("../../index.ts");

// Restore the original serve function
Object.defineProperty(globalThis, "serve", {
  value: originalServe,
  writable: true,
  configurable: true
});

// Setup environment for tests
const mockEnv = {
  GITHUB_TOKEN: "mock-github-token",
  GITHUB_ORG: "mock-org",
  GITHUB_API_VERSION: "v3",
  CACHE_TTL: "300"
};

Deno.test("Projects API - List projects endpoint", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  const mockResponse = createMockResponse(200, mockListProjectsResponse, mockRateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act
    const request = createMockRequest("GET", "/projects");
    const response = await requestHandler(request);
    
    // Assert
    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Content-Type"), "application/json");
    
    const body = await response.json();
    assertEquals(body.data.organization.projectsV2.nodes.length, 2);
    assertEquals(body.data.organization.projectsV2.nodes[0].title, "Test Project 1");
    assertEquals(body.meta.rateLimit.limit, 5000);
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("Projects API - Get project by number endpoint", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  const mockResponse = createMockResponse(200, mockGetProjectResponse, mockRateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act
    const request = createMockRequest("GET", "/projects/1");
    const response = await requestHandler(request);
    
    // Assert
    assertEquals(response.status, 200);
    
    const body = await response.json();
    assertEquals(body.data.organization.projectV2.title, "Test Project 1");
    assertEquals(body.data.organization.projectV2.fields.nodes.length, 2);
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("Projects API - Get project items endpoint", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  
  // We need to mock two fetch calls:
  // 1. First to get the project details
  // 2. Then to get the project items
  let fetchCallCount = 0;
  
  // @ts-ignore - Mocking global fetch
  globalThis.fetch = async (url: string, options: RequestInit): Promise<Response> => {
    fetchCallCount++;
    
    if (fetchCallCount === 1) {
      // First call should return project details
      return createMockResponse(200, mockGetProjectResponse, mockRateLimitHeaders);
    } else {
      // Second call should return project items
      return createMockResponse(200, mockGetProjectItemsResponse, mockRateLimitHeaders);
    }
  };
  
  try {
    // Act
    const request = createMockRequest("GET", "/projects/1/items");
    const response = await requestHandler(request);
    
    // Assert
    assertEquals(response.status, 200);
    assertEquals(fetchCallCount, 2); // Verify both fetch calls were made
    
    const body = await response.json();
    assertEquals(body.data.node.items.nodes.length, 2);
    assertEquals(body.data.node.items.nodes[0].content.title, "Test Issue 1");
    assertEquals(body.data.node.items.nodes[1].content.title, "Test Pull Request 1");
  } finally {
    // @ts-ignore - Restore global fetch
    globalThis.fetch = fetch;
    restoreEnv();
  }
});

Deno.test("Projects API - Add item to project endpoint", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  
  // We need to mock two fetch calls again
  let fetchCallCount = 0;
  
  // @ts-ignore - Mocking global fetch
  globalThis.fetch = async (url: string, options: RequestInit): Promise<Response> => {
    fetchCallCount++;
    
    if (fetchCallCount === 1) {
      // First call should return project details
      return createMockResponse(200, mockGetProjectResponse, mockRateLimitHeaders);
    } else {
      // Second call should return add item result
      return createMockResponse(200, mockAddItemToProjectResponse, mockRateLimitHeaders);
    }
  };
  
  try {
    // Act
    const request = createMockRequest(
      "POST", 
      "/projects/1/add-item", 
      { contentId: "I_kwDOABCD123" }
    );
    const response = await requestHandler(request);
    
    // Assert
    assertEquals(response.status, 200);
    assertEquals(fetchCallCount, 2); // Verify both fetch calls were made
    
    const body = await response.json();
    assertEquals(body.data.addProjectV2ItemById.item.id, "PVTI_lADOABCD789");
  } finally {
    // @ts-ignore - Restore global fetch
    globalThis.fetch = fetch;
    restoreEnv();
  }
});

Deno.test("Projects API - Update project item field endpoint", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  
  // We need to mock two fetch calls again
  let fetchCallCount = 0;
  
  // @ts-ignore - Mocking global fetch
  globalThis.fetch = async (url: string, options: RequestInit): Promise<Response> => {
    fetchCallCount++;
    
    if (fetchCallCount === 1) {
      // First call should return project details
      return createMockResponse(200, mockGetProjectResponse, mockRateLimitHeaders);
    } else {
      // Second call should return update field result
      return createMockResponse(200, mockUpdateProjectItemFieldResponse, mockRateLimitHeaders);
    }
  };
  
  try {
    // Act
    const request = createMockRequest(
      "POST", 
      "/projects/1/update-item", 
      { 
        itemId: "PVTI_lADOABCD123", 
        fieldId: "PVTF_lADOABCD456", 
        value: "PVTFO_lADOABCD123" // High priority
      }
    );
    const response = await requestHandler(request);
    
    // Assert
    assertEquals(response.status, 200);
    assertEquals(fetchCallCount, 2); // Verify both fetch calls were made
    
    const body = await response.json();
    assertEquals(body.data.updateProjectV2ItemFieldValue.projectV2Item.id, "PVTI_lADOABCD123");
  } finally {
    // @ts-ignore - Restore global fetch
    globalThis.fetch = fetch;
    restoreEnv();
  }
});

Deno.test("Projects API - Error handling for invalid project number", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  const errorResponse = {
    errors: [
      {
        message: "Could not resolve to an Organization with the login of 'mock-org'.",
        type: "NOT_FOUND",
        path: ["organization"]
      }
    ]
  };
  const mockResponse = createMockResponse(200, errorResponse, mockRateLimitHeaders);
  const restoreFetch = mockFetch(mockResponse);
  
  try {
    // Act
    const request = createMockRequest("GET", "/projects/999");
    const response = await requestHandler(request);
    
    // Assert
    assertEquals(response.status, 400);
    
    const body = await response.json();
    assertStringIncludes(body.error, "GraphQL Error");
  } finally {
    restoreFetch();
    restoreEnv();
  }
});

Deno.test("Projects API - Error handling for missing required fields", async () => {
  // Arrange
  const restoreEnv = mockDenoEnv(mockEnv);
  
  try {
    // Act - Missing contentId
    const request = createMockRequest("POST", "/projects/1/add-item", {});
    const response = await requestHandler(request);
    
    // Assert
    assertEquals(response.status, 400);
    
    const body = await response.json();
    assertStringIncludes(body.error, "Missing required field: contentId");
  } finally {
    restoreEnv();
  }
});