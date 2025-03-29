/**
 * Response Interceptor
 * Wraps API calls to monitor and manage rate limits
 */

import { ResponseMetadata, RequestDistributionStrategy } from "../types/rateLimit.ts";
import { RateMonitor } from "./rateMonitor.ts";
import { RateLimitManager } from "./rateLimitManager.ts";

// Singleton instances for global access
let rateMonitor: RateMonitor | null = null;
let rateLimitManager: RateLimitManager | null = null;

/**
 * Get the global rate monitor instance
 */
export function getRateMonitor(): RateMonitor {
  if (!rateMonitor) {
    rateMonitor = new RateMonitor();
  }
  return rateMonitor;
}

/**
 * Get the global rate limit manager instance
 */
export function getRateLimitManager(): RateLimitManager {
  if (!rateLimitManager) {
    rateLimitManager = new RateLimitManager();
  }
  return rateLimitManager;
}

/**
 * Reset the rate monitoring system
 */
export function resetRateMonitoring(): void {
  // Clean up any existing instances
  if (rateLimitManager) {
    rateLimitManager.reset();
  }
  if (rateMonitor) {
    rateMonitor.reset();
  }
  
  // Re-create instances
  rateMonitor = new RateMonitor();
  rateLimitManager = new RateLimitManager(rateMonitor);
}

/**
 * Set the request distribution strategy
 */
export function setDistributionStrategy(strategy: RequestDistributionStrategy): void {
  const manager = getRateLimitManager();
  manager.setStrategy(strategy);
}

/**
 * Options for intercepted requests
 */
export interface InterceptOptions {
  provider: string;
  apiKey: string;
  skipRateLimitCheck?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Intercept a function call to monitor rate limits
 * 
 * @param fn The function to intercept
 * @param options Interception options
 * @returns The result of the function call
 */
export async function interceptRequest<T>(
  fn: () => Promise<T>,
  options: InterceptOptions
): Promise<T> {
  const manager = getRateLimitManager();
  
  // Register the API key
  manager.registerKey(options.apiKey, options.provider);
  
  // Check if we can proceed with this request
  if (!options.skipRateLimitCheck) {
    const preCheck = manager.preRequest(options.apiKey, options.provider);
    if (!preCheck.canProceed) {
      throw new Error(`Rate limited: retry after ${preCheck.retryAfter} seconds`);
    }
  }
  
  const requestTime = Date.now();
  let result: T;
  let error: Error | null = null;
  let statusCode = 200;
  let errorMessage: string | undefined;
  let errorType: string | undefined;
  
  try {
    // Execute the original function
    result = await fn();
  } catch (e) {
    error = e as Error;
    
    // Extract status code and error details if available
    statusCode = extractStatusCode(e) || 500;
    errorMessage = extractErrorMessage(e);
    errorType = extractErrorType(e);
    
    // Re-throw the error
    throw e;
  } finally {
    const responseTime = Date.now();
    
    // Build metadata
    const metadata: ResponseMetadata = {
      statusCode,
      headers: {},  // API-specific headers would be added by the API client
      error: error ? {
        message: errorMessage,
        type: errorType
      } : undefined,
      responseTime: responseTime - requestTime,
      requestTime: requestTime,
      provider: options.provider,
      apiKey: options.apiKey,
      ...options.metadata
    };
    
    // Process the response regardless of success or failure
    manager.processResponse(metadata);
  }
  
  return result;
}

/**
 * Extract a status code from an error if available
 */
function extractStatusCode(error: any): number | null {
  // Check common error patterns
  if (error.status) return error.status;
  if (error.statusCode) return error.statusCode;
  if (error.response?.status) return error.response.status;
  
  // Check error message for status codes
  const message = String(error.message || error);
  const statusMatch = message.match(/(\b4\d\d\b|\b5\d\d\b)/);
  if (statusMatch) {
    return parseInt(statusMatch[1], 10);
  }
  
  return null;
}

/**
 * Extract an error message from an error if available
 */
function extractErrorMessage(error: any): string | undefined {
  if (error.message) return error.message;
  if (error.error?.message) return error.error.message;
  if (error.response?.data?.error?.message) return error.response.data.error.message;
  if (typeof error === 'string') return error;
  
  return undefined;
}

/**
 * Extract an error type from an error if available
 */
function extractErrorType(error: any): string | undefined {
  if (error.type) return error.type;
  if (error.code) return error.code;
  if (error.error?.type) return error.error.type;
  if (error.response?.data?.error?.type) return error.response.data.error.type;
  
  return undefined;
}

/**
 * Helper to select the best API key from a pool
 * 
 * @param provider The API provider
 * @param apiKeys Array of available API keys
 * @returns The selected API key, or undefined if none are available
 */
export function selectBestApiKey(provider: string, apiKeys: string[]): string | undefined {
  const manager = getRateLimitManager();
  return manager.selectBestKey(provider, apiKeys);
}

/**
 * Get a summary of API key health for monitoring
 */
export function getApiKeyHealthSummary(): Record<string, any> {
  const manager = getRateLimitManager();
  const healthState = manager.getHealthState();
  
  const result: Record<string, any> = {};
  
  for (const [keyId, state] of healthState.entries()) {
    // Format key ID for display
    const [provider, keyHint] = keyId.split(':');
    const displayKey = `${provider}:${keyHint.substring(0, 4)}...${keyHint.substring(keyHint.length - 4)}`;
    
    result[displayKey] = {
      provider: state.provider,
      healthScore: state.healthScore,
      status: state.isRateLimited ? 'rate_limited' : 'healthy',
      capacity: `${state.rpmRemaining}/${state.rpmLimit} RPM`,
      retryAfter: state.retryAfter !== undefined ? `${state.retryAfter}s` : 'N/A'
    };
  }
  
  return result;
}