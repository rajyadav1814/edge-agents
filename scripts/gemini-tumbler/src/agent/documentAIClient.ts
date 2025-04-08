/**
 * Client for Google Document AI API
 */

import { GoogleAIClient, UsageLimits } from "../types/googleAIClient.ts";
import { TokenUsage } from "../types/index.ts";

interface DocumentAIConfig {
  apiKey?: string;
  apiKeys?: string[];
  projectId?: string;
  processorId?: string;
  location?: string;
  parameters?: Record<string, any>;
}

/**
 * Client for interacting with Google Document AI
 */
export class DocumentAIClient implements GoogleAIClient {
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private projectId: string;
  private processorId: string;
  private location: string;
  private baseUrl: string;
  
  constructor(config: DocumentAIConfig) {
    if (config.apiKeys && config.apiKeys.length > 0) {
      this.apiKeys = config.apiKeys;
    } else if (config.apiKey) {
      this.apiKeys = [config.apiKey];
    } else {
      throw new Error("At least one API key is required for DocumentAIClient");
    }
    
    if (!config.projectId) {
      throw new Error("Project ID is required for DocumentAIClient");
    }
    
    if (!config.processorId) {
      throw new Error("Processor ID is required for DocumentAIClient");
    }
    
    this.projectId = config.projectId;
    this.processorId = config.processorId;
    this.location = config.location || "us";
    this.baseUrl = `https://${this.location}-documentai.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}`;
  }
  
  /**
   * Process a document through Document AI
   * @param input Base64-encoded document content or text
   * @param options Processing options
   * @returns The processed document
   */
  async process(input: string, options?: Record<string, any>): Promise<{
    result: any;
    usage: TokenUsage;
  }> {
    const apiKey = this.getNextApiKey();
    const mimeType = options?.mimeType || "application/pdf";
    const isBase64 = options?.isBase64 || true;
    const promptTokens = this.estimateTokenCount(input);
    
    try {
      const url = `${this.baseUrl}:process?key=${apiKey}`;
      
      // Prepare the request body
      const requestBody: any = {
        rawDocument: {
          content: input,
          mimeType: mimeType
        }
      };
      
      // If input is plain text, not base64
      if (!isBase64) {
        requestBody.document = {
          content: input,
          mimeType: "text/plain"
        };
        delete requestBody.rawDocument;
      }
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Document AI error: ${errorData.error?.message || response.statusText}`);
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
      console.error("Error calling Document AI API:", error);
      throw error;
    }
  }
  
  /**
   * Get the capabilities of this service
   */
  getCapabilities(): string[] {
    return [
      "document-ocr",
      "form-parsing",
      "entity-extraction",
      "document-classification"
    ];
  }
  
  /**
   * Get the usage limits for this service
   */
  getUsageLimits(): UsageLimits {
    return {
      requestsPerMinute: 5,
      requestsPerDay: 500
    };
  }
  
  /**
   * Set processing parameters (not applicable for this client)
   */
  setParameters(_params: Record<string, any>): void {
    // Document AI doesn't have adjustable parameters like temperature
  }
  
  /**
   * Get the service type
   */
  getServiceType(): string {
    return "document-ai";
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