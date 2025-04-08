import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { handleCORS, getCorsHeaders } from "../_shared/cors.ts";
import { EnvironmentValidator } from "../config/env-validator.ts";

Deno.test("CORS handler - preflight request", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("CORS_ALLOWED_ORIGINS", "*");
  
  const req = new Request("http://localhost:8000", {
    method: "OPTIONS",
    headers: new Headers({
      "Origin": "http://localhost:3000",
    }),
  });

  // Test
  const response = handleCORS(req);

  // Assert
  assertEquals(response.status, 204);
  assertEquals(
    response.headers.get("Access-Control-Allow-Methods"),
    "GET, POST, OPTIONS"
  );
  assertEquals(
    response.headers.get("Access-Control-Allow-Origin"),
    "*"
  );
});

Deno.test("CORS handler - actual request with base response", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("CORS_ALLOWED_ORIGINS", "*");
  
  const req = new Request("http://localhost:8000", {
    method: "POST",
    headers: new Headers({
      "Origin": "http://localhost:3000",
    }),
  });

  const baseResponse = new Response("Test response", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
    },
  });

  // Test
  const response = handleCORS(req, baseResponse);

  // Assert
  assertEquals(response.status, 200);
  assertEquals(response.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(response.headers.get("Content-Type"), "text/plain");
});

Deno.test("CORS handler - specific origin", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("CORS_ALLOWED_ORIGINS", "https://example.com");
  
  const req = new Request("http://localhost:8000", {
    method: "POST",
    headers: new Headers({
      "Origin": "https://example.com",
    }),
  });

  // Test
  const response = handleCORS(req);

  // Assert
  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://example.com"
  );
  assertEquals(
    response.headers.get("Access-Control-Allow-Credentials"),
    "true"
  );
});

Deno.test("CORS handler - multiple origins", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("CORS_ALLOWED_ORIGINS", "https://example.com,https://test.com");
  
  const req = new Request("http://localhost:8000", {
    method: "POST",
    headers: new Headers({
      "Origin": "https://test.com",
    }),
  });

  // Test
  const response = handleCORS(req);

  // Assert
  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://test.com"
  );
});

Deno.test("CORS handler - disallowed origin", () => {
  // Setup
  EnvironmentValidator.resetConfig();
  Deno.env.set("CORS_ALLOWED_ORIGINS", "https://example.com");
  
  const req = new Request("http://localhost:8000", {
    method: "POST",
    headers: new Headers({
      "Origin": "https://malicious.com",
    }),
  });

  // Test
  const response = handleCORS(req);

  // Assert
  assertEquals(response.status, 200);
  assertEquals(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://example.com"
  );
});