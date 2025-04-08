/**
 * Rate limiting types and interfaces
 */

/**
 * Types of rate limits
 */
export enum RateLimitType {
  RPM = "requests_per_minute",
  TPM = "tokens_per_minute",
  RPD = "requests_per_day",
  CONCURRENT = "concurrent_requests"
}

/**
 * Request distribution strategies
 */
export enum RequestDistributionStrategy {
  ROUND_ROBIN = "round_robin",
  HEALTH_AWARE = "health_aware",
  LEAST_UTILIZED = "least_utilized",
  PREDICTIVE = "predictive"
}

/**
 * Metadata about an API response
 */
export interface ResponseMetadata {
  statusCode: number;
  headers: Record<string, string>;
  responseTime: number;
  requestTime: number;
  provider: string;
  apiKey: string;
  error?: {
    type?: string;
    message?: string;
  };
  [key: string]: any; // Allow additional metadata
}

/**
 * Result of rate limit detection analysis
 */
export interface RateLimitDetectionResult {
  isRateLimited: boolean;
  confidence: number;
  limitType?: RateLimitType;
  limitValue?: number;
  limitRemaining?: number;
  retryAfter?: number;
  resetTime?: number;
  provider: string;
  apiKey: string;
}

/**
 * API key health state
 */
export interface ApiKeyHealthState {
  provider: string;
  apiKey: string;
  healthScore: number;
  isRateLimited: boolean;
  rpmLimit?: number;
  rpmRemaining?: number;
  tpmLimit?: number;
  tpmRemaining?: number;
  retryAfter?: number;
  resetTime?: number;
  lastUpdated: number;
}

/**
 * Pre-request check result
 */
export interface PreRequestCheckResult {
  canProceed: boolean;
  retryAfter?: number;
  reason?: string;
}