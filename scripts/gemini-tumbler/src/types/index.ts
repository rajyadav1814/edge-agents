/**
 * Type definitions for the Gemini Tumbler service
 */

/**
 * Configuration for the Gemini client
 */
export interface GeminiConfig {
  apiKey?: string;
  modelName: string;
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
}

/**
 * Token usage information
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

/**
 * Configuration for the Tumbler service
 */
export interface TumblerConfig {
  rotationInterval: number;
  defaultModel: string;
  anonymousContribution: boolean;
  contributionEndpoint?: string;
  additionalModels?: AdditionalModel[];
}

/**
 * Additional model configuration
 */
export interface AdditionalModel {
  name: string;
  provider: string;
  apiKeyEnvVar: string;
  apiEndpoint?: string;
}

/**
 * Generation request parameters
 */
export interface GenerationRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  contributionConsent?: boolean;
  anonymousId?: string;
}

/**
 * Generation response
 */
export interface GenerationResponse {
  content: string;
  model: string;
  tokenUsage: TokenUsage;
  processingTime: number;
  id: string;
  timestamp: number;
}

/**
 * Contribution data
 */
export interface Contribution {
  id: string;
  prompt: string;
  response: string;
  model: string;
  timestamp: number;
  anonymousId?: string;
  feedback?: ContributionFeedback[];
}

/**
 * Feedback for a contribution
 */
export interface ContributionFeedback {
  id: string;
  rating: number;
  comment?: string;
  timestamp: number;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  version: string;
  uptime: number;
  timestamp: number;
}

/**
 * Available models response
 */
export interface ModelsResponse {
  default: string;
  available: string[];
  current: string;
  nextRotation: number;
}