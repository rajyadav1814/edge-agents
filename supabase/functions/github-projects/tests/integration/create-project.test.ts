import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { createMockRequest, mockFetch, createMockResponse } from "../mocks/test-utils.ts";
import { handleRequest } from "../../index.ts";

Deno.test("Project Creation API - creates a project successfully", async () => {
  // Mock environment
  Deno.env.set("GITHUB_TOKEN", "mock_token");
  Deno.env.set("GITHUB_ORG", "agenticsorg");
  
  // Mock the GraphQL responses
  const orgIdResponse = {
    data: {
      organization: {
        id: "O_kgDOC6dDnA"
      }
    }
  };
  
  const createProjectResponse = {
    data: {
      createProjectV2: {
        projectV2: {
          id: "PVT_kwDOC6dDnM4A2KkE",
          title: "Test Project",
          number: 7,
          shortDescription: "A test project created via API",
          url: "https://github.com/orgs/agenticsorg/projects/7",
          createdAt: new Date().toISOString()
        }
      }
    }
  };
  
  // Setup fetch mock
  const originalFetch = globalThis.fetch;
  let fetchCallCount = 0;
  
  // @ts-ignore - Mocking global fetch
  globalThis.fetch = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
    fetchCallCount++;
    
    // Check if this is a GraphQL request
    if (typeof input === 'string' && input.includes('graphql')) {
      const body = init?.body ? JSON.parse(init.body as string) : {};
      
      // Return different responses based on the query
      if (body.query?.includes('GetOrganizationId')) {
        return new Response(JSON.stringify(orgIdResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } else if (body.query?.includes('CreateProject')) {
        return new Response(JSON.stringify(createProjectResponse), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    // Default response
    return new Response(JSON.stringify({ error: "Unexpected request" }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  
  try {
    // Mock request with project creation data
    const req = createMockRequest(
      "POST",
      "/projects/create",
      {
        title: "Test Project",
        description: "A test project created via API"
      },
      { "Content-Type": "application/json" }
    );

    // Call the handler
    const res = await handleRequest(req);
    
    // Verify response
    assertEquals(res.status, 201);
    const body = await res.json();
    assertExists(body.data);
    assertEquals(body.data.title, "Test Project");
    assertEquals(body.meta.timestamp.substring(0, 4), new Date().getFullYear().toString());
  } finally {
    // Restore original fetch
    globalThis.fetch = originalFetch;
  }
});

Deno.test("Project Creation API - handles missing title", async () => {
  // Mock environment
  Deno.env.set("GITHUB_TOKEN", "mock_token");
  Deno.env.set("GITHUB_ORG", "agenticsorg");
  
  // Mock request with missing title
  const req = createMockRequest(
    "POST",
    "/projects/create",
    {
      description: "A test project created via API"
    },
    { "Content-Type": "application/json" }
  );

  // Call the handler
  const res = await handleRequest(req);
  
  // Verify response
  assertEquals(res.status, 400);
  const body = await res.json();
  assertExists(body.error);
  assertEquals(body.error, "Project title is required");
});