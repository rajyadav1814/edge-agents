/**
 * Rate Monitor
 * Analyzes API responses to detect rate limiting patterns
 */

import { 
  RateLimitType, 
  ResponseMetadata, 
  RateLimitDetectionResult 
} from "../types/rateLimit.ts";

/**
 * Monitors API responses to detect rate limiting patterns
 */
export class RateMonitor {
  private responseHistory: Map<string, ResponseMetadata[]> = new Map();
  private baselineResponseTimes: Map<string, number[]> = new Map();
  private anomalyThreshold = 2.5; // Response time multiplier to consider anomalous
  private historyLimit = 100; // Maximum number of responses to keep in history
  private minSamplesForBaseline = 5; // Minimum samples needed to establish a baseline

  /**
   * Analyze a response to detect rate limiting
   * 
   * @param response The response metadata to analyze
   * @returns Detection result with rate limiting information
   */
  public analyzeResponse(response: ResponseMetadata): RateLimitDetectionResult {
    // Initialize result with defaults
    const result: RateLimitDetectionResult = {
      isRateLimited: false,
      confidence: 0,
      provider: response.provider,
      apiKey: response.apiKey
    };

    // Track this response in history
    this.trackResponse(response);

    // Check for explicit rate limiting signals
    if (this.detectExplicitRateLimiting(response, result)) {
      return result;
    }

    // Check rate limit headers
    if (this.detectRateLimitHeaders(response, result)) {
      return result;
    }

    // Check for timing anomalies
    if (this.detectTimingAnomalies(response, result)) {
      return result;
    }

    // No rate limiting detected
    return result;
  }

  /**
   * Track a response in the history
   */
  private trackResponse(response: ResponseMetadata): void {
    const key = `${response.provider}:${response.apiKey}`;
    
    // Initialize history for this key if needed
    if (!this.responseHistory.has(key)) {
      this.responseHistory.set(key, []);
    }
    
    // Add to history
    const history = this.responseHistory.get(key)!;
    history.push(response);
    
    // Trim history if needed
    if (history.length > this.historyLimit) {
      history.shift();
    }
    
    // Update baseline response times for successful responses
    if (response.statusCode >= 200 && response.statusCode < 300) {
      this.updateBaselineResponseTime(key, response.responseTime);
    }
  }

  /**
   * Update the baseline response time for a key
   */
  private updateBaselineResponseTime(key: string, responseTime: number): void {
    if (!this.baselineResponseTimes.has(key)) {
      this.baselineResponseTimes.set(key, []);
    }
    
    const times = this.baselineResponseTimes.get(key)!;
    times.push(responseTime);
    
    // Keep only the most recent samples
    if (times.length > this.minSamplesForBaseline * 2) {
      times.shift();
    }
  }

  /**
   * Detect explicit rate limiting signals in a response
   */
  private detectExplicitRateLimiting(
    response: ResponseMetadata, 
    result: RateLimitDetectionResult
  ): boolean {
    // Check for 429 status code
    if (response.statusCode === 429) {
      result.isRateLimited = true;
      result.confidence = 1.0;
      result.limitType = RateLimitType.RPM; // Assume RPM by default
      
      // Extract retry-after header if available
      if (response.headers["Retry-After"] || response.headers["retry-after"]) {
        const retryAfter = parseInt(response.headers["Retry-After"] || response.headers["retry-after"], 10);
        if (!isNaN(retryAfter)) {
          result.retryAfter = retryAfter;
        }
      }
      
      // Check for specific error types in the response
      if (response.error?.type) {
        const errorType = response.error.type.toLowerCase();
        if (errorType.includes("rate_limit") || errorType.includes("quota")) {
          // Confirm it's definitely rate limiting
          result.confidence = 1.0;
          
          // Try to determine the type of limit
          if (errorType.includes("token") || errorType.includes("tpm")) {
            result.limitType = RateLimitType.TPM;
          } else if (errorType.includes("rpm")) {
            result.limitType = RateLimitType.RPM;
          } else if (errorType.includes("concurrent")) {
            result.limitType = RateLimitType.CONCURRENT;
          }
        }
      }
      
      return true;
    }
    
    // Check for error messages that indicate rate limiting
    if (response.error?.message) {
      const errorMessage = response.error.message.toLowerCase();
      if (
        errorMessage.includes("rate limit") || 
        errorMessage.includes("too many requests") ||
        errorMessage.includes("quota exceeded")
      ) {
        result.isRateLimited = true;
        result.confidence = 0.9;
        result.limitType = RateLimitType.RPM; // Assume RPM by default
        return true;
      }
    }
    
    return false;
  }

  /**
   * Detect rate limit information from response headers
   */
  private detectRateLimitHeaders(
    response: ResponseMetadata, 
    result: RateLimitDetectionResult
  ): boolean {
    let foundRateLimitInfo = false;
    
    // Check for common rate limit headers
    for (const [headerName, headerValue] of Object.entries(response.headers)) {
      const headerNameLower = headerName.toLowerCase();
      
      // Parse rate limit headers
      if (headerNameLower.includes("ratelimit") || headerNameLower.includes("rate-limit")) {
        // Parse rate limit headers
        const parsedValue = this.parseRateLimitHeader(headerName, headerValue);
        if (parsedValue) {
          result.limitValue = parsedValue.limitValue;
          result.limitType = RateLimitType.RPM; // Ensure we always set a default limit type
          result.limitRemaining = parsedValue.limitRemaining;
          result.resetTime = parsedValue.resetTime;

          // If we're close to the limit, mark as rate limited with lower confidence
          if (parsedValue.limitRemaining !== undefined && 
              parsedValue.limitValue !== undefined &&
              parsedValue.limitRemaining / parsedValue.limitValue < 0.1) {
            result.isRateLimited = true;
            result.confidence = 0.7;
          }
          
          foundRateLimitInfo = true;
        }
      }
    }
    
    return foundRateLimitInfo;
  }

  /**
   * Parse a rate limit header value
   */
  private parseRateLimitHeader(headerName: string, headerValue: string): {
    limitValue?: number;
    limitRemaining?: number;
    resetTime?: number;
    limitType?: RateLimitType;
  } | null {
    const headerNameLower = headerName.toLowerCase();
    const result: {
      limitValue?: number;
      limitRemaining?: number;
      resetTime?: number;
      limitType?: RateLimitType;
    } = {};
    
    // Extract limit value
    if (headerNameLower.includes("limit") && !headerNameLower.includes("remaining") && !headerNameLower.includes("reset")) {
      const limitValue = parseInt(headerValue, 10);
      if (!isNaN(limitValue)) {
        result.limitValue = limitValue;
      }
    }
    
    // Extract remaining value
    if (headerNameLower.includes("remaining")) {
      const remainingValue = parseInt(headerValue, 10);
      if (!isNaN(remainingValue)) {
        result.limitRemaining = remainingValue;
      }
    }
    
    // Extract reset time
    if (headerNameLower.includes("reset")) {
      const resetValue = parseInt(headerValue, 10);
      if (!isNaN(resetValue)) {
        // Some APIs use Unix timestamp, others use seconds from now
        result.resetTime = resetValue > 1000000000 ? resetValue : Date.now() / 1000 + resetValue;
      }
    }
    
    // Determine limit type if possible
    if (headerNameLower.includes("minute") || headerNameLower.includes("rpm")) {
      result.limitType = RateLimitType.RPM;
    } else if (headerNameLower.includes("token") || headerNameLower.includes("tpm")) {
      result.limitType = RateLimitType.TPM;
    } else if (headerNameLower.includes("day") || headerNameLower.includes("daily")) {
      result.limitType = RateLimitType.RPD;
    } else if (headerNameLower.includes("concurrent")) {
      result.limitType = RateLimitType.CONCURRENT;
    }
    
    // Only return if we found at least one value
    return Object.keys(result).length > 0 ? result : null;
  }

  /**
   * Detect rate limiting from timing anomalies
   */
  private detectTimingAnomalies(
    response: ResponseMetadata, 
    result: RateLimitDetectionResult
  ): boolean {
    const key = `${response.provider}:${response.apiKey}`;
    const baselineTimes = this.baselineResponseTimes.get(key);
    
    // Skip if we don't have enough baseline data
    if (!baselineTimes || baselineTimes.length < this.minSamplesForBaseline) {
      return false;
    }
    
    // Calculate average baseline response time
    const avgBaselineTime = baselineTimes.reduce((sum, time) => sum + time, 0) / baselineTimes.length;
    
    // Check if current response time is significantly higher than baseline
    if (response.responseTime > avgBaselineTime * this.anomalyThreshold) {
      result.isRateLimited = true;
      result.confidence = 0.5 + Math.min(0.4, (response.responseTime / avgBaselineTime - this.anomalyThreshold) / 10);
      result.limitType = RateLimitType.RPM; // Assume RPM by default
      return true;
    }
    
    return false;
  }

  /**
   * Get the response history for a specific provider and API key
   */
  public getResponseHistory(provider: string, apiKey: string): ResponseMetadata[] {
    const key = `${provider}:${apiKey}`;
    return this.responseHistory.get(key) || [];
  }

  /**
   * Reset all monitoring data
   */
  public reset(): void {
    this.responseHistory.clear();
    this.baselineResponseTimes.clear();
  }
}