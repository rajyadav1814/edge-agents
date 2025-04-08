/**
 * Rate Limiter Utility
 * Handles rate limiting for API requests
 */
import { EnvironmentValidator } from "../config/env-validator.ts";

/**
 * Rate limit information
 */
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Rate limit entry
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * Rate Limiter
 * Handles rate limiting for API requests
 */
export class RateLimiter {
  private entries: Map<string, RateLimitEntry>;
  private limit: number;
  private window: number;
  
  /**
   * Create a new rate limiter
   */
  constructor() {
    this.entries = new Map();
    
    // Get configuration
    const config = EnvironmentValidator.getConfig();
    this.limit = config.RATE_LIMIT_MAX_REQUESTS;
    this.window = config.RATE_LIMIT_WINDOW_MS;
  }
  
  /**
   * Check rate limit for a key
   * @param key Key to check rate limit for
   * @returns Rate limit information
   */
  public checkRateLimit(key: string): RateLimitInfo {
    const now = Date.now();
    
    // Get or create entry
    let entry = this.entries.get(key);
    
    if (!entry || entry.resetTime <= now) {
      // Create new entry if none exists or if the window has expired
      entry = {
        count: 0,
        resetTime: now + this.window,
      };
      this.entries.set(key, entry);
    }
    
    // Increment count
    entry.count++;
    
    // Calculate remaining requests
    const remaining = Math.max(0, this.limit - entry.count);
    
    // Return rate limit information
    return {
      limit: this.limit,
      remaining,
      reset: entry.resetTime,
    };
  }
  
  /**
   * Add rate limit headers to a response
   * @param response Response to add headers to
   * @param rateLimitInfo Rate limit information
   * @returns Response with rate limit headers
   */
  public addRateLimitHeaders(
    response: Response,
    rateLimitInfo: RateLimitInfo
  ): Response {
    const headers = new Headers(response.headers);
    
    headers.set("X-RateLimit-Limit", rateLimitInfo.limit.toString());
    headers.set("X-RateLimit-Remaining", rateLimitInfo.remaining.toString());
    headers.set("X-RateLimit-Reset", Math.floor(rateLimitInfo.reset / 1000).toString());
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  
  /**
   * Clean up expired entries
   */
  public cleanupExpiredEntries(): void {
    const now = Date.now();
    
    for (const [key, entry] of this.entries.entries()) {
      if (entry.resetTime <= now) {
        this.entries.delete(key);
      }
    }
  }
  
  /**
   * Reset rate limit for a key
   * @param key Key to reset rate limit for
   */
  public resetRateLimit(key: string): void {
    this.entries.delete(key);
  }
  
  /**
   * Get current rate limit information for a key
   * @param key Key to get rate limit information for
   * @returns Rate limit information, or null if no entry exists
   */
  public getRateLimitInfo(key: string): RateLimitInfo | null {
    const entry = this.entries.get(key);
    
    if (!entry) {
      return null;
    }
    
    return {
      limit: this.limit,
      remaining: Math.max(0, this.limit - entry.count),
      reset: entry.resetTime,
    };
  }
}