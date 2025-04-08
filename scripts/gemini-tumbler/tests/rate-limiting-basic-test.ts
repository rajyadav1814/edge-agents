/**
 * Basic tests for rate limiting detection and management
 */

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { 
  ResponseMetadata 
} from "../src/types/rateLimit.ts";
import { RateMonitor } from "../src/utils/rateMonitor.ts";

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

// Log completion of tests
console.log("✓ All basic rate limiting tests completed");