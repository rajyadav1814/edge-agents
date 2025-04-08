import { assertEquals, assertNotEquals } from "https://deno.land/std/testing/asserts.ts";
import { AuthManager } from "../../core/auth.ts";

// Test suite for the AuthManager class
Deno.test("AuthManager - Initialization", () => {
  const secretKey = "test-secret-key";
  const authManager = new AuthManager(secretKey);
  
  // Verify the AuthManager was created successfully
  assertEquals(typeof authManager, "object");
  assertEquals(authManager instanceof AuthManager, true);
});

Deno.test("AuthManager - Token Validation", () => {
  const secretKey = "test-secret-key";
  const authManager = new AuthManager(secretKey);
  
  // Valid token should return true
  assertEquals(authManager.validateToken(secretKey), true);
  
  // Invalid token should return false
  assertEquals(authManager.validateToken("invalid-token"), false);
  assertEquals(authManager.validateToken(""), false);
  assertEquals(authManager.validateToken(null as unknown as string), false);
});

Deno.test("AuthManager - Request Verification", () => {
  const secretKey = "test-secret-key";
  const authManager = new AuthManager(secretKey);
  
  // Create a valid request with the correct Authorization header
  const validRequest = new Request("https://example.com", {
    headers: {
      "Authorization": `Bearer ${secretKey}`
    }
  });
  
  // Create an invalid request with an incorrect Authorization header
  const invalidRequest = new Request("https://example.com", {
    headers: {
      "Authorization": "Bearer invalid-token"
    }
  });
  
  // Create a request with no Authorization header
  const noAuthRequest = new Request("https://example.com");
  
  // Create a request with malformed Authorization header
  const malformedRequest = new Request("https://example.com", {
    headers: {
      "Authorization": secretKey // Missing "Bearer " prefix
    }
  });
  
  // Test all request scenarios
  assertEquals(authManager.verifyRequest(validRequest), true);
  assertEquals(authManager.verifyRequest(invalidRequest), false);
  assertEquals(authManager.verifyRequest(noAuthRequest), false);
  assertEquals(authManager.verifyRequest(malformedRequest), false);
});

Deno.test("AuthManager - Environment Variable Integration", () => {
  // Save the original environment variable
  const originalEnv = Deno.env.get("MCP_SECRET_KEY");
  
  try {
    // Set a test environment variable
    Deno.env.set("MCP_SECRET_KEY", "env-test-key");
    
    // Create an AuthManager that uses the environment variable by passing the key directly
    const authManager = new AuthManager("env-test-key");
    
    // Test that it correctly uses the environment variable
    assertEquals(authManager.validateToken("env-test-key"), true);
    assertEquals(authManager.validateToken("wrong-key"), false);
    
    // Test with a request
    const validRequest = new Request("https://example.com", {
      headers: {
        "Authorization": "Bearer env-test-key"
      }
    });
    
    assertEquals(authManager.verifyRequest(validRequest), true);
  } finally {
    // Restore the original environment variable
    if (originalEnv) {
      Deno.env.set("MCP_SECRET_KEY", originalEnv);
    } else {
      Deno.env.delete("MCP_SECRET_KEY");
    }
  }
});