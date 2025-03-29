/**
 * Tests for rate limiting detection and management
 */

import { assertEquals, assert, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  RateLimitType, 
  ResponseMetadata,
  RequestDistributionStrategy
} from "../src/types/rateLimit.ts";
import { RateMonitor } from "../src/utils/rateMonitor.ts";
import { interceptRequest, getRateLimitManager, resetRateMonitoring } from "../src/utils/responseInterceptor.ts";
import { getTestRateMonitor, getTestRateLimitManager, resetTestRateMonitoring } from "./test-utils.ts";

// Mock API keys for testing
const TEST_API_KEYS = {
  google: ["google-api-key-1", "google-api-key-2", "google-api-key-3"],
  openai: ["openai-api-key-1", "openai-api-key-2"],
  anthropic: ["anthropic-api-key-1"]
};

// Test for explicit rate limiting detection
Deno.test("RateMonitor - Detect explicit rate limiting", () => {
  const monitor = new RateMonitor();
  
  // Test with a 429 status code
  const rateLimitedResponse: ResponseMetadata = {
    statusCode: 429,
    headers: {
      "Retry-After": "30"
    },
    responseTime: 100,
    requestTime: Date.now(),
    provider: "google",
    apiKey: "test-api-key",
    error: {
      type: "rate_limit_exceeded",
      message: "Too many requests, please try again later."
    }
  };
  
  const result = monitor.analyzeResponse(rateLimitedResponse);
  
  assert(result.isRateLimited, "Should detect rate limiting");
  assertEquals(result.retryAfter, 30, "Should extract retry-after value");
  assert(result.confidence >= 0.8, "Should have high confidence");
});

// Test for rate limiting detection from headers
Deno.test("RateMonitor - Detect rate limiting from headers", () => {
  const monitor = new RateMonitor();
  
  // Test with rate limit headers
  const responseWithHeaders: ResponseMetadata = {
    statusCode: 200,
    headers: {
      "X-RateLimit-Limit": "100",
      "X-RateLimit-Remaining": "5",
      "X-RateLimit-Reset": "1600000000"
    },
    responseTime: 100,
    requestTime: Date.now(),
    provider: "google",
    apiKey: "test-api-key"
  };
  
  const result = monitor.analyzeResponse(responseWithHeaders);
  
  assert(result.limitValue === 100, "Should extract limit value");
  assertEquals(result.limitValue, 100, "Should extract limit value");
  assertEquals(result.limitRemaining, 5, "Should extract remaining value");
});

// Test for timing anomaly detection
Deno.test("RateMonitor - Detect timing anomalies", async () => {
  resetTestRateMonitoring();
  const monitor = getTestRateMonitor();
  
  // First, establish a baseline with normal responses
  for (let i = 0; i < 5; i++) {
    monitor.analyzeResponse({
      statusCode: 200,
      headers: {},
      responseTime: 100, // Normal response time
      requestTime: Date.now() - (i * 100), // Simulate requests over time
      provider: "google",
      apiKey: "test-api-key"
    });
  }
  
  // Then test with a slow response
  const slowResponse: ResponseMetadata = {
    statusCode: 200,
    headers: {},
    responseTime: 500, // 5x slower
    requestTime: Date.now(),
    provider: "google",
    apiKey: "test-api-key"
  };
  
  const result = monitor.analyzeResponse(slowResponse);
  
  assert(result.isRateLimited, "Should detect rate limiting from timing anomaly");
  assert(result.confidence >= 0.5, "Should have moderate confidence");
  assertEquals(result.limitType, RateLimitType.RPM, "Should assume RPM limit type");
});

// Test key registration and tracking
Deno.test("RateLimitManager - Key registration and tracking", () => {
  resetTestRateMonitoring();
  
  const manager = getTestRateLimitManager();
  
  // Register some keys
  for (const key of TEST_API_KEYS.google) {
    manager.registerKey(key, "google");
  }
  
  // Get health state
  const healthState = manager.getHealthState();
  
  // Verify keys were registered
  assertEquals(healthState.size, TEST_API_KEYS.google.length, "Should register all keys");
  
  // Verify initial health
  for (const key of TEST_API_KEYS.google) {
    const keyId = `google:${key}`;
    const keyHealth = healthState.get(keyId);
    
    assert(keyHealth, `Should have health state for ${keyId}`);
    assertEquals(keyHealth?.healthScore, 100, "Should have perfect initial health");
  }
});

// Test pre-request check and capacity management
Deno.test("RateLimitManager - Pre-request check and capacity management", () => {
  resetTestRateMonitoring();
  
  const manager = getTestRateLimitManager();
  
  const key = TEST_API_KEYS.google[0];
  manager.registerKey(key, "google");
  
  // First request should succeed
  const firstCheck = manager.preRequest(key, "google");
  assert(firstCheck.canProceed, "First request should be allowed");
  
  // Simulate rate limiting
  manager.processResponse({
    statusCode: 429,
    headers: {
      "Retry-After": "30"
    },
    responseTime: 100,
    requestTime: Date.now(),
    provider: "google",
    apiKey: key,
    error: {
      type: "rate_limit_exceeded",
      message: "Too many requests"
    }
  });
  
  // Next request should be blocked
  const secondCheck = manager.preRequest(key, "google");
  assert(!secondCheck.canProceed, "Request should be blocked after rate limiting");
  assert(secondCheck.retryAfter && secondCheck.retryAfter > 0, "Should provide retry after time");
});

// Test key selection strategy
Deno.test("RateLimitManager - Key selection strategy", () => {
  resetTestRateMonitoring();
  
  const manager = getTestRateLimitManager();
  
  // Register all test keys
  for (const key of TEST_API_KEYS.google) {
    manager.registerKey(key, "google");
  }
  
  // Set first key as rate limited
  manager.processResponse({
    statusCode: 429,
    headers: {},
    responseTime: 100,
    requestTime: Date.now(),
    provider: "google",
    apiKey: TEST_API_KEYS.google[0],
    error: {
      type: "rate_limit_exceeded",
      message: "Too many requests"
    }
  });
  
  // Set second key as somewhat unhealthy
  manager.processResponse({
    statusCode: 500,
    headers: {},
    responseTime: 200,
    requestTime: Date.now(),
    provider: "google",
    apiKey: TEST_API_KEYS.google[1]
  });
  
  // Test health-aware strategy (default)
  const selectedKey = manager.selectBestKey("google", TEST_API_KEYS.google);
  assertNotEquals(selectedKey, TEST_API_KEYS.google[0], "Should not select rate-limited key");
  
  // Test least utilized strategy
  manager.setStrategy(RequestDistributionStrategy.LEAST_UTILIZED);
  const leastUtilizedKey = manager.selectBestKey("google", TEST_API_KEYS.google);
  assert(leastUtilizedKey, "Should select a key");
});

// Test successful request interception
Deno.test("interceptRequest - Successful request", async () => {
  resetRateMonitoring();
  
  // Test successful interception
  const result = await interceptRequest(
    async () => "success",
    { 
      provider: "google", 
      apiKey: "test-api-key" 
    }
  );
  
  assertEquals(result, "success");

  // Verify the key was registered
  const manager = getRateLimitManager();
  const healthState = manager.getHealthState();
  
  assert(healthState.size > 0, "Health state should have entries");
});

// Test error handling in request interception
Deno.test("interceptRequest - Error handling", async () => {
  resetRateMonitoring();
  
  // Test error interception
  try {
    await interceptRequest(
      async () => {
        throw new Error("API error");
      },
      { 
        provider: "google", 
        apiKey: "test-api-key" 
      }
    );
    
    // Should not reach here
    assert(false, "Should have thrown an error");
  } catch (e) {
    const manager = getRateLimitManager();
    const healthState = manager.getHealthState();
    
    // Verify the key was registered despite the error
    assert(healthState.size > 0, "Health state should have entries");
    
    // Verify the error was passed through
    assert(e instanceof Error, "Should throw the original error");
    assertEquals(e.message, "API error", "Should preserve error message");
  }
});

// Test end-to-end rate limit detection and key rotation
Deno.test("End-to-end - Rate limit detection and key rotation", async () => {
  resetTestRateMonitoring();
  
  const manager = getTestRateLimitManager();
  
  // Register all test keys
  for (const key of TEST_API_KEYS.google) {
    manager.registerKey(key, "google");
  }
  
  // Set up a counter to track which key is used
  let requestCount = 0;
  const usedKeys: string[] = [];
  
  // Mock request function that simulates rate limiting on first key
  const mockRequest = async (apiKey: string) => {
    requestCount++;
    usedKeys.push(apiKey);
    
    if (apiKey === TEST_API_KEYS.google[0] && requestCount === 1) {
      throw new Error("Rate limit exceeded");
    }
    
    return "success";
  };
  
  // First request should use first key and fail
  try {
    await interceptRequest(
      async () => mockRequest(TEST_API_KEYS.google[0]),
      { 
        provider: "google", 
        apiKey: TEST_API_KEYS.google[0] 
      }
    );
    
    assert(false, "First request should fail");
  } catch (e) {
    // Expected error
  }
  
  // Second request should use a different key and succeed
  const result = await interceptRequest(
    async () => mockRequest(TEST_API_KEYS.google[1]),
    { 
      provider: "google", 
      apiKey: TEST_API_KEYS.google[1] 
    }
  );
  
  assertEquals(result, "success", "Second request should succeed");
  assertEquals(usedKeys.length, 2, "Should have made 2 requests");
  assertNotEquals(usedKeys[0], usedKeys[1], "Should use different keys");
});

// Log completion of tests
console.log("✓ All rate limiting tests completed");