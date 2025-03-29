/**
 * Client for Google Vertex AI API
 */

import { GoogleAIClient, UsageLimits } from "../types/googleAIClient.ts";
import { TokenUsage } from "../types/index.ts";

interface VertexAIConfig {
  apiKey?: string;
  apiKeys?: string[];
  projectId?: string;
  region?: string;
  modelName?: string;
  parameters?: Record<string, any>;
}

/**
 * Client for interacting with Google Vertex AI
 */
export class VertexAIClient implements GoogleAIClient {
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private projectId: string;
  private region: string;
  private modelName: string;
  private temperature: number;
  private maxOutputTokens: number;
  private baseUrl: string;
  
  constructor(config: VertexAIConfig) {
    if (config.apiKeys && config.apiKeys.length > 0) {
      this.apiKeys = config.apiKeys;
    } else if (config.apiKey) {
      this.apiKeys = [config.apiKey];
    } else {
      throw new Error("At least one API key is required for VertexAIClient");
    }
    
    if (!config.projectId) {
      throw new Error("Project ID is required for VertexAIClient");
    }
    
    this.projectId = config.projectId;
    this.region = config.region || "us-central1";
    this.modelName = config.modelName || "gemini-1.5-pro";
    this.temperature = config.parameters?.temperature ?? 0.7;
    this.maxOutputTokens = config.parameters?.maxOutputTokens ?? 2048;
    this.baseUrl = `https://${this.region}-aiplatform.googleapis.com/v1/projects/${this.projectId}/locations/${this.region}`;
  }
  
  /**
   * Process an input through Vertex AI
   * @param input The input to process
   * @param options Optional processing options
   * @returns The processed result
   */
  async process(input: string, options?: Record<string, any>): Promise<{
    result: any;
    usage: TokenUsage;
  }> {
    const apiKey = this.getNextApiKey();
    const promptTokens = this.estimateTokenCount(input);
    const systemPrompt = options?.systemPrompt;
    const systemTokens = systemPrompt ? this.estimateTokenCount(systemPrompt) : 0;
    
    try {
      const url = `${this.baseUrl}/publishers/google/models/${this.modelName}:predict`;
      
      const requestBody: any = {
        instances: [
          {
            prompt: input
          }
        ],
        parameters: {
          temperature: options?.temperature ?? this.temperature,
          maxOutputTokens: options?.maxTokens ?? this.maxOutputTokens,
        }
      };
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Vertex AI API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      const result = data.predictions[0].content;
      const completionTokens = this.estimateTokenCount(result);
      
      // Rotate to the next key
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      
      const usage: TokenUsage = {
        promptTokens: promptTokens + systemTokens,
        completionTokens,
        totalTokens: promptTokens + systemTokens + completionTokens
      };
      
      return { result, usage };
    } catch (error) {
      console.error("Error calling Vertex AI API:", error);
      throw error;
    }
  }
  
  /**
   * Get the capabilities of this service
   */
  getCapabilities(): string[] {
    return [
      "text-generation",
      "code-generation",
      "embedding",
      "chat",
      "reasoning",
      "multimodal"
    ];
  }
  
  /**
   * Get the usage limits for this service
   */
  getUsageLimits(): UsageLimits {
    return {
      requestsPerMinute: 20,
      requestsPerDay: 2000
    };
  }
  
  /**
   * Set processing parameters
   * @param params Parameters to set
   */
  setParameters(params: Record<string, any>): void {
    if (params.temperature !== undefined) this.temperature = params.temperature;
    if (params.maxOutputTokens !== undefined) this.maxOutputTokens = params.maxOutputTokens;
  }
  
  /**
   * Get the service type
   */
  getServiceType(): string {
    return "vertex";
  }
  
  /**
   * Get the number of available API keys
   */
  getKeyCount(): number {
    return this.apiKeys.length;
  }
  
  /**
   * Get the next API key in the rotation
   */
  private getNextApiKey(): string {
    return this.apiKeys[this.currentKeyIndex];
  }
  
  /**
   * Estimate token count for a given text
   */
  private estimateTokenCount(text: string): number {
    return Math.ceil(text.length / 4);
  }
}