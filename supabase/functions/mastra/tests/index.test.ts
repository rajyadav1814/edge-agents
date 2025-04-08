/**
 * Main index.ts tests for the Mastra AI agent
 */

import { assertEquals, assertExists, assertMatch } from "https://deno.land/std@0.220.1/assert/mod.ts";
import { assertSpyCall, spy } from "https://deno.land/std@0.220.1/testing/mock.ts";
import { handleRequest } from "../index.ts";
import { config } from "../config/index.ts";
import { tools } from "../tools/index.ts";

// We'll use a different approach for middleware testing
// Instead of stubbing, we'll just let the real middleware run
// since it's designed to pass through for our test cases

Deno.test("handleRequest - should reject non-POST requests", async () => {
  const req = new Request("https://example.com", {
    method: "GET"
  });
  
  const response = await handleRequest(req);
  
  assertEquals(response.status, 405);
  const body = await response.json();
  assertEquals(body.error, "Method not allowed. Only POST requests are supported.");
});

Deno.test("handleRequest - should reject requests without query", async () => {
  const req = new Request("https://example.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });
  
  const response = await handleRequest(req);
  
  assertEquals(response.status, 400);
  const body = await response.json();
  assertEquals(body.error, "Missing required field: query");
});

Deno.test("handleRequest - should process valid requests", async () => {
  const req = new Request("https://example.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: "Hello, Mastra!"
    })
  });
  
  const response = await handleRequest(req);
  
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.response);
  assertMatch(body.response, /You asked: "Hello, Mastra!"/);
  assertExists(body.metadata);
  assertExists(body.metadata.processedAt);
  assertEquals(body.metadata.agentName, config.agent.name);
});

Deno.test("handleRequest - should handle weather queries", async () => {
  const req = new Request("https://example.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: "What's the weather in New York?"
    })
  });
  
  const response = await handleRequest(req);
  
  assertEquals(response.status, 200);
  const body = await response.json();
  assertExists(body.response);
  assertMatch(body.response, /You asked: "What's the weather in New York\?"/);
  assertMatch(body.response, /I checked the weather for you/);
  assertMatch(body.response, /The current weather in New York is/);
});

Deno.test("handleRequest - should handle errors gracefully", async () => {
  // Create a request that will cause an error
  const req = new Request("https://example.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: "invalid json"
  });
  
  const response = await handleRequest(req);
  
  assertEquals(response.status, 500);
  const body = await response.json();
  assertExists(body.error);
  assertMatch(body.error, /Error processing request/);
});

Deno.test("handleRequest - should include CORS headers in response", async () => {
  const req = new Request("https://example.com", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query: "Hello, Mastra!"
    })
  });
  
  const response = await handleRequest(req);
  
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(
    response.headers.get("Access-Control-Allow-Headers"),
    "authorization, x-client-info, apikey, content-type"
  );
  assertEquals(
    response.headers.get("Access-Control-Allow-Methods"),
    "GET, POST, OPTIONS"
  );
});