/**
 * Test utilities for rate limiting tests
 */

import { RateMonitor } from "../src/utils/rateMonitor.ts";
import { RateLimitManager } from "../src/utils/rateLimitManager.ts";

// Singleton instances for testing
let testRateMonitor: RateMonitor | null = null;
let testRateLimitManager: RateLimitManager | null = null;

/**
 * Test implementation of RateLimitManager for testing
 */
export class TestRateLimitManager extends RateLimitManager {
  /**
   * Reset the manager for testing
   */
  public override reset(): void {
    super.reset();
    this.dispose(); // Make sure to clean up any intervals
  }
}

/**
 * Get the test rate monitor instance
 */
export function getTestRateMonitor(): RateMonitor {
  if (!testRateMonitor) {
    testRateMonitor = new RateMonitor();
  }
  return testRateMonitor;
}

/**
 * Get the test rate limit manager instance
 */
export function getTestRateLimitManager(): RateLimitManager {
  if (!testRateLimitManager) {
    testRateLimitManager = new TestRateLimitManager(getTestRateMonitor());
  }
  return testRateLimitManager;
}

/**
 * Reset the test rate monitoring system
 */
export function resetTestRateMonitoring(): void {
  // Clean up any existing instances
  if (testRateLimitManager) {
    testRateLimitManager.dispose();
  }
  
  // Reset instances
  testRateMonitor = null;
  testRateLimitManager = null;
  
  // Re-create instances
  testRateMonitor = new RateMonitor();
  testRateLimitManager = new TestRateLimitManager(testRateMonitor);
}