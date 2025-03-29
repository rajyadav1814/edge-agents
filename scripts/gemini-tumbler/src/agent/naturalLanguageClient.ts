/**
 * Client for Google Natural Language API
 */

import { GoogleAIClient, UsageLimits } from "../types/googleAIClient.ts";
import { TokenUsage } from "../types/index.ts";

interface NaturalLanguageConfig {
  apiKey?: string;
  apiKeys?: string[];
  projectId?: string;
  parameters?: Record<string, any>;
}

/**
 * Client for interacting with Google Natural Language API
 */
export class NaturalLanguageClient implements GoogleAIClient {
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private baseUrl = "https://language.googleapis.com/v1";
  
  constructor(config: NaturalLanguageConfig) {
    if (config.apiKeys && config.apiKeys.length > 0) {
      this.apiKeys = config.apiKeys;
    } else if (config.apiKey) {
      this.apiKeys = [config.apiKey];
    } else {
      throw new Error("At least one API key is required for NaturalLanguageClient");
    }
    
    // Note: projectId is not used in REST API calls with API key authentication
  }
  
  /**
   * Process text through Natural Language API
   * @param input The text to analyze
   * @param options Analysis options
   * @returns The analysis result
   */
  async process(input: string, options?: Record<string, any>): Promise<{
    result: any;
    usage: TokenUsage;
  }> {
    const apiKey = this.getNextApiKey();
    const analysisType = options?.analysisType || "sentiment";
    const promptTokens = this.estimateTokenCount(input);
    
    try {
      let endpoint: string;
      let requestBody: any = {
        document: {
          type: "PLAIN_TEXT",
          content: input
        }
      };
      
      // Select the appropriate endpoint based on analysis type
      switch (analysisType) {
        case "sentiment":
          endpoint = "/analyzeSentiment";
          break;
        case "entities":
          endpoint = "/analyzeEntities";
          break;
        case "syntax":
          endpoint = "/analyzeSyntax";
          break;
        case "classify":
          endpoint = "/classifyText";
          break;
        default:
          endpoint = "/analyzeSentiment";
      }
      
      const url = `${this.baseUrl}${endpoint}?key=${apiKey}`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Natural Language API error: ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Rotate to the next key
      this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
      
      // Estimate response tokens (rough estimate)
      const responseJson = JSON.stringify(data);
      const completionTokens = this.estimateTokenCount(responseJson);
      
      const usage: TokenUsage = {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens
      };
      
      return { result: data, usage };
    } catch (error) {
      console.error("Error calling Natural Language API:", error);
      throw error;
    }
  }
  
  /**
   * Get the capabilities of this service
   */
  getCapabilities(): string[] {
    return [
      "entity-recognition",
      "sentiment-analysis",
      "content-classification",
      "syntax-analysis"
    ];
  }
  
  /**
   * Get the usage limits for this service
   */
  getUsageLimits(): UsageLimits {
    return {
      requestsPerMinute: 10,
      requestsPerDay: 1000
    };
  }
  
  /**
   * Set processing parameters (not applicable for this client)
   */
  setParameters(_params: Record<string, any>): void {
    // Natural Language API doesn't have adjustable parameters like temperature
  }
  
  /**
   * Get the service type
   */
  getServiceType(): string {
    return "natural-language";
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