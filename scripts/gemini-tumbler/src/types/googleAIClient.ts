/**
 * Common interface for all Google AI service clients
 */

import { TokenUsage } from "./index.ts";

/**
 * Usage limits for a service
 */
export interface UsageLimits {
  requestsPerMinute: number;
  requestsPerDay: number;
  tokensPerRequest?: number;
}

/**
 * Base interface for all Google AI clients
 */
export interface GoogleAIClient<InputType = string, OutputType = any> {
  /**
   * Process an input and return a result
   * @param input The input to process
   * @param options Optional processing options
   */
  process(input: InputType, options?: Record<string, any>): Promise<{
    result: OutputType;
    usage: TokenUsage;
  }>;

  /**
   * Get the capabilities of this service
   */
  getCapabilities(): string[];

  /**
   * Get the usage limits for this service
   */
  getUsageLimits(): UsageLimits;

  /**
   * Set processing parameters
   * @param params Parameters to set
   */
  setParameters(params: Record<string, any>): void;

  /**
   * Get the service type
   */
  getServiceType(): string;

  /**
   * Get the number of available API keys
   */
  getKeyCount(): number;
}

/**
 * Configuration for a Google AI service
 */
export interface ServiceConfig {
  serviceType: string;
  apiKey?: string;
  apiKeys?: string[];
  projectId?: string;
  region?: string;
  endpoint?: string;
  parameters?: Record<string, any>;
}