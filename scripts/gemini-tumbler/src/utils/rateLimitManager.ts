/**
 * Rate Limit Manager
 * Manages API key health and rate limit distribution
 */

import { 
  ApiKeyHealthState, 
  PreRequestCheckResult, 
  RateLimitDetectionResult, 
  RequestDistributionStrategy, 
  ResponseMetadata 
} from "../types/rateLimit.ts";
import { RateMonitor } from "./rateMonitor.ts";

/**
 * Manages API key health and rate limit distribution
 */
export class RateLimitManager {
  private keyHealth: Map<string, ApiKeyHealthState> = new Map();
  private monitor: RateMonitor;
  private strategy: RequestDistributionStrategy = RequestDistributionStrategy.HEALTH_AWARE;
  private keyUsageCount: Map<string, number> = new Map();
  private defaultHealthScore = 100;
  private healthDecayRate = 10; // How much to reduce health score on errors
  private healthRecoveryRate = 1; // How much to increase health score on success
  private healthRecoveryInterval = 60000; // 1 minute in ms
  private healthRecoveryTimer: number | null = null;

  constructor(monitor?: RateMonitor) {
    this.monitor = monitor || new RateMonitor();
    // Don't automatically start health recovery - we'll do it explicitly
  }

  /**
   * Register an API key for tracking
   * 
   * @param apiKey The API key to register
   * @param provider The provider this key belongs to
   */
  public registerKey(apiKey: string, provider: string): void {
    const keyId = this.getKeyId(provider, apiKey);
    
    // Skip if already registered
    if (this.keyHealth.has(keyId)) {
      return;
    }
    
    // Initialize health state
    this.keyHealth.set(keyId, {
      provider,
      apiKey,
      healthScore: this.defaultHealthScore,
      isRateLimited: false,
      lastUpdated: Date.now()
    });
    
    // Initialize usage count
    this.keyUsageCount.set(keyId, 0);
  }

  /**
   * Process a response to update key health
   * 
   * @param response The response metadata to process
   */
  public processResponse(response: ResponseMetadata): void {
    // Register the key if not already registered
    this.registerKey(response.apiKey, response.provider);
    
    // Analyze the response for rate limiting
    const result = this.monitor.analyzeResponse(response);
    
    // Update key health based on analysis
    this.updateKeyHealth(result);
    
    // Increment usage count
    const keyId = this.getKeyId(response.provider, response.apiKey);
    const currentCount = this.keyUsageCount.get(keyId) || 0;
    this.keyUsageCount.set(keyId, currentCount + 1);
  }

  /**
   * Update key health based on rate limit detection
   * 
   * @param result The rate limit detection result
   */
  private updateKeyHealth(result: RateLimitDetectionResult): void {
    const keyId = this.getKeyId(result.provider, result.apiKey);
    const health = this.keyHealth.get(keyId);
    
    if (!health) {
      return;
    }
    
    // Update health state
    if (result.isRateLimited) {
      // Reduce health score based on confidence
      health.healthScore = Math.max(0, health.healthScore - this.healthDecayRate * result.confidence);
      health.isRateLimited = true;
      
      // Update rate limit information
      if (result.limitType) {
        switch (result.limitType) {
          case "requests_per_minute":
            health.rpmLimit = result.limitValue;
            health.rpmRemaining = result.limitRemaining;
            break;
          case "tokens_per_minute":
            health.tpmLimit = result.limitValue;
            health.tpmRemaining = result.limitRemaining;
            break;
        }
      }
      
      // Update retry information
      if (result.retryAfter) {
        health.retryAfter = result.retryAfter;
      }
      
      if (result.resetTime) {
        health.resetTime = result.resetTime;
      }
    } else if (result.limitRemaining !== undefined && result.limitValue !== undefined) {
      // Update remaining capacity
      switch (result.limitType) {
        case "requests_per_minute":
          health.rpmLimit = result.limitValue;
          health.rpmRemaining = result.limitRemaining;
          break;
        case "tokens_per_minute":
          health.tpmLimit = result.limitValue;
          health.tpmRemaining = result.limitRemaining;
          break;
      }
      
      // Slightly improve health score for successful requests
      health.healthScore = Math.min(this.defaultHealthScore, health.healthScore + this.healthRecoveryRate);
      
      // Clear rate limiting flag if we have capacity
      if (result.limitRemaining && result.limitRemaining > 0) {
        health.isRateLimited = false;
        health.retryAfter = undefined;
      }
    } else {
      // Successful request with no explicit rate limit info
      health.healthScore = Math.min(this.defaultHealthScore, health.healthScore + this.healthRecoveryRate);
      
      // Clear rate limiting flag for successful requests
      health.isRateLimited = false;
      health.retryAfter = undefined;
    }
    
    health.lastUpdated = Date.now();
  }

  /**
   * Check if a request can proceed with a given API key
   * 
   * @param apiKey The API key to check
   * @param provider The provider this key belongs to
   * @returns Result indicating if the request can proceed
   */
  public preRequest(apiKey: string, provider: string): PreRequestCheckResult {
    const keyId = this.getKeyId(provider, apiKey);
    const health = this.keyHealth.get(keyId);
    
    // If key is not registered, register it and allow the request
    if (!health) {
      this.registerKey(apiKey, provider);
      return { canProceed: true };
    }
    
    // Check if key is rate limited
    if (health.isRateLimited) {
      // Check if retry time has passed
      if (health.retryAfter) {
        const currentTime = Date.now() / 1000;
        const retryTime = health.lastUpdated / 1000 + health.retryAfter;
        
        if (currentTime < retryTime) {
          return {
            canProceed: false,
            retryAfter: Math.ceil(retryTime - currentTime),
            reason: "Rate limited"
          };
        }
      }
      
      // Check if reset time has passed
      if (health.resetTime) {
        const currentTime = Date.now() / 1000;
        
        if (currentTime < health.resetTime) {
          return {
            canProceed: false,
            retryAfter: Math.ceil(health.resetTime - currentTime),
            reason: "Rate limited until reset time"
          };
        }
      }
      
      // If no specific retry time, but health score is very low, block the request
      if (health.healthScore < 20) {
        return {
          canProceed: false,
          retryAfter: 30, // Default backoff
          reason: "Health score too low"
        };
      }
    }
    
    // Check remaining capacity if available
    if (health.rpmRemaining !== undefined && health.rpmRemaining <= 0) {
      return {
        canProceed: false,
        retryAfter: 60, // Default to 1 minute for RPM limits
        reason: "No remaining RPM capacity"
      };
    }
    
    // Allow the request
    return { canProceed: true };
  }

  /**
   * Select the best API key to use from a pool
   * 
   * @param provider The provider to select a key for
   * @param apiKeys Array of available API keys
   * @returns The selected API key, or undefined if none are available
   */
  public selectBestKey(provider: string, apiKeys: string[]): string | undefined {
    if (!apiKeys || apiKeys.length === 0) {
      return undefined;
    }
    
    // If only one key, use it
    if (apiKeys.length === 1) {
      return apiKeys[0];
    }
    
    // Apply the selected strategy
    switch (this.strategy) {
      case RequestDistributionStrategy.ROUND_ROBIN:
        return this.selectKeyRoundRobin(provider, apiKeys);
      
      case RequestDistributionStrategy.LEAST_UTILIZED:
        return this.selectKeyLeastUtilized(provider, apiKeys);
      
      case RequestDistributionStrategy.PREDICTIVE:
        return this.selectKeyPredictive(provider, apiKeys);
      
      case RequestDistributionStrategy.HEALTH_AWARE:
      default:
        return this.selectKeyHealthAware(provider, apiKeys);
    }
  }

  /**
   * Select a key using round-robin strategy
   */
  private selectKeyRoundRobin(provider: string, apiKeys: string[]): string | undefined {
    // Find the key with the lowest usage count
    let minCount = Infinity;
    let selectedKey: string | undefined;
    
    for (const key of apiKeys) {
      const keyId = this.getKeyId(provider, key);
      const count = this.keyUsageCount.get(keyId) || 0;
      
      if (count < minCount) {
        minCount = count;
        selectedKey = key;
      }
    }
    
    return selectedKey;
  }

  /**
   * Select a key using health-aware strategy
   */
  private selectKeyHealthAware(provider: string, apiKeys: string[]): string | undefined {
    // Find the key with the highest health score that's not rate limited
    let maxScore = -1;
    let selectedKey: string | undefined;
    
    for (const key of apiKeys) {
      const keyId = this.getKeyId(provider, key);
      const health = this.keyHealth.get(keyId);
      
      // Skip rate limited keys
      if (health?.isRateLimited) {
        continue;
      }
      
      const score = health?.healthScore || this.defaultHealthScore;
      
      if (score > maxScore) {
        maxScore = score;
        selectedKey = key;
      }
    }
    
    // If all keys are rate limited, pick the one with the highest health score
    if (!selectedKey) {
      for (const key of apiKeys) {
        const keyId = this.getKeyId(provider, key);
        const health = this.keyHealth.get(keyId);
        const score = health?.healthScore || 0;
        
        if (score > maxScore) {
          maxScore = score;
          selectedKey = key;
        }
      }
    }
    
    return selectedKey || apiKeys[0]; // Fallback to first key if none selected
  }

  /**
   * Select a key using least-utilized strategy
   */
  private selectKeyLeastUtilized(provider: string, apiKeys: string[]): string | undefined {
    // Find the key with the most remaining capacity
    let maxRemaining = -1;
    let selectedKey: string | undefined;
    
    for (const key of apiKeys) {
      const keyId = this.getKeyId(provider, key);
      const health = this.keyHealth.get(keyId);
      
      // Skip rate limited keys
      if (health?.isRateLimited) {
        continue;
      }
      
      const remaining = health?.rpmRemaining || Infinity;
      
      if (remaining > maxRemaining) {
        maxRemaining = remaining;
        selectedKey = key;
      }
    }
    
    // Fallback to health-aware if no key has remaining capacity info
    return selectedKey || this.selectKeyHealthAware(provider, apiKeys);
  }

  /**
   * Select a key using predictive strategy
   */
  private selectKeyPredictive(provider: string, apiKeys: string[]): string | undefined {
    // This is a placeholder for a more sophisticated predictive algorithm
    // For now, it's equivalent to health-aware
    return this.selectKeyHealthAware(provider, apiKeys);
  }

  /**
   * Set the request distribution strategy
   * 
   * @param strategy The strategy to use
   */
  public setStrategy(strategy: RequestDistributionStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Get the current health state of all keys
   */
  public getHealthState(): Map<string, ApiKeyHealthState> {
    return new Map(this.keyHealth);
  }

  /**
   * Get a key ID from provider and API key
   */
  private getKeyId(provider: string, apiKey: string): string {
    return `${provider}:${apiKey}`;
  }

  /**
   * Start the health recovery timer
   */
  private startHealthRecovery(): void {
    // Clear any existing timer
    if (this.healthRecoveryTimer !== null) {
      clearInterval(this.healthRecoveryTimer);
    }
    
    // Start a new timer
    this.healthRecoveryTimer = setInterval(() => {
      this.recoverKeyHealth();
    }, this.healthRecoveryInterval);
  }

  /**
   * Recover key health over time
   */
  private recoverKeyHealth(): void {
    const currentTime = Date.now();
    
    for (const health of this.keyHealth.values()) {
      // Skip keys that are at full health
      if (health.healthScore >= this.defaultHealthScore) {
        continue;
      }
      
      // Skip keys that are actively rate limited with a retry time
      if (health.isRateLimited && health.retryAfter) {
        const retryTime = health.lastUpdated / 1000 + health.retryAfter;
        if (currentTime / 1000 < retryTime) {
          continue;
        }
      }
      
      // Skip keys that are waiting for reset time
      if (health.resetTime && currentTime / 1000 < health.resetTime) {
        continue;
      }
      
      // Gradually recover health
      health.healthScore = Math.min(
        this.defaultHealthScore,
        health.healthScore + this.healthRecoveryRate
      );
      
      // Clear rate limiting if health is good enough
      if (health.healthScore > 50) {
        health.isRateLimited = false;
        health.retryAfter = undefined;
      }
    }
  }

  /**
   * Reset all rate limit management data
   */
  public reset(): void {
    this.keyHealth.clear();
    this.keyUsageCount.clear();
    this.monitor.reset();
    this.dispose(); // Clean up any timers
    
    // Restart health recovery
    this.startHealthRecovery();
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.healthRecoveryTimer !== null) {
      clearInterval(this.healthRecoveryTimer);
      this.healthRecoveryTimer = null;
    }
  }
}