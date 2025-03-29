/**
 * Direct Gemini client implementation that uses fetch API to directly call the v1beta endpoint
 * for experimental models like gemini-2.5-pro-exp-03-25
 */

import { GeminiConfig, TokenUsage } from "../types/index.ts";
import { GoogleAIClient, UsageLimits } from "../types/googleAIClient.ts";
import { interceptRequest, selectBestApiKey } from "../utils/responseInterceptor.ts";

export class DirectGeminiClient implements GoogleAIClient {
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private modelName: string;
  private temperature: number;
  private topP: number;
  private topK: number;
  private maxOutputTokens: number;

  constructor(config: GeminiConfig & { apiKeys?: string[] }) {
    // Handle single API key or multiple keys
    if (config.apiKeys && config.apiKeys.length > 0) {
      this.apiKeys = config.apiKeys;
    } else if (config.apiKey) {
      this.apiKeys = [config.apiKey];
    } else {
      throw new Error("At least one API key is required for DirectGeminiClient");
    }
    
    this.modelName = config.modelName;
    this.temperature = config.temperature ?? 0.7;
    this.topP = config.topP ?? 0.95;
    this.topK = config.topK ?? 40;
    this.maxOutputTokens = config.maxOutputTokens ?? 2048;
  }

  /**
   * Get the next API key in rotation
   * @returns The next API key
   */
  private getNextApiKey(): string {
    if (this.apiKeys.length === 0) {
      throw new Error("No valid API keys available");
    }
    
    // Try to select the best key using the rate limit manager
    const bestKey = selectBestApiKey('google', this.apiKeys);
    if (bestKey && this.apiKeys.includes(bestKey)) {
      return bestKey;
    }
    
    // Fall back to round-robin if no best key was found or rate limiting is not initialized
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
    return this.apiKeys[this.currentKeyIndex];
  }

  /**
   * Process an input through Gemini
   * @param input The input to process
   * @param options Optional processing options
   * @returns The processed result
   */
  async process(input: string, options?: Record<string, any>): Promise<{
    result: any;
    usage: TokenUsage;
  }> {
    const systemPrompt = options?.systemPrompt;
    const { text, tokenUsage } = await this.generateText(input, systemPrompt);
    return { result: text, usage: tokenUsage };
  }

  /**
   * Generate a response from the Gemini model using direct API call
   * @param prompt The prompt to send to the model
   * @param systemPrompt Optional system prompt
   * @returns The generated text and token usage
   */
  async generateText(prompt: string, systemPrompt?: string): Promise<{
    text: string;
    tokenUsage: TokenUsage;
  }> {
    // Try all available keys until one works
    const initialKeyIndex = this.currentKeyIndex;
    let lastError: Error | null = null;
    let keysAttempted = 0; // Count keys attempted to avoid infinite loops
    
    // Try each key in rotation until one works or we've tried them all
    while (keysAttempted < this.apiKeys.length) {
      try {
        // Get the next API key to try
        const apiKey = this.getNextApiKey();
        keysAttempted++;

        // Use the interceptRequest function to wrap the API call
        return await interceptRequest(
          async () => {
            // Determine API version based on model name
            const apiVersion = this.modelName.includes("exp") ? "v1beta" : "v1";
            console.log(`Using API version ${apiVersion} for model ${this.modelName}`);
            
            // Construct the API URL
            const apiUrl = `https://generativelanguage.googleapis.com/${apiVersion}/models/${this.modelName}:generateContent?key=${apiKey}`;
            
            // Prepare the request body
            let requestBody: any;
            
            // Combine system prompt and user prompt if needed
            const fullPrompt = systemPrompt 
              ? `${systemPrompt}\n\n${prompt}` 
              : prompt;
            
            // Use a simplified format that works for both v1 and v1beta
            requestBody = {
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: fullPrompt }
                  ]
                }
              ],
              generationConfig: {
                temperature: this.temperature,
                topP: this.topP,
                topK: this.topK,
                maxOutputTokens: this.maxOutputTokens,
              }
            };
            
            // Log the request for debugging
            console.log(`Making direct API call to ${apiUrl}`);
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API request failed with status ${response.status}: ${errorText}`);
            }
            
            const responseData = await response.json();
            
            // Log the response for debugging
            console.log(`API response: ${JSON.stringify(responseData, null, 2)}`);
            
            // Extract the generated text
            let text = "";
            if (responseData.candidates && responseData.candidates.length > 0 && 
                responseData.candidates[0].content && responseData.candidates[0].content.parts) {
              if (Array.isArray(responseData.candidates[0].content.parts)) {
                text = responseData.candidates[0].content.parts
                  .map((part: any) => part.text || "")
                  .join("");
              } else if (typeof responseData.candidates[0].content.parts === 'object') {
                text = responseData.candidates[0].content.parts.text || "";
              }
            }
            
            // If no text was extracted, try to extract it from the first part
            if (!text && responseData.candidates && responseData.candidates.length > 0 && 
                responseData.candidates[0].content && responseData.candidates[0].content.parts && 
                Array.isArray(responseData.candidates[0].content.parts) && 
                responseData.candidates[0].content.parts.length > 0) {
              const firstPart = responseData.candidates[0].content.parts[0];
              if (firstPart && typeof firstPart === 'object' && firstPart.text) {
                text = firstPart.text;
              }
            }
            
            // If still no text, log a warning but don't throw an error
            if (!text) {
              console.warn("Warning: No text extracted from response", responseData);
              text = "I apologize, but I couldn't generate a response. Please try again.";
            }
            
            // Get token usage from response if available
            let tokenUsage: TokenUsage;
            if (responseData.usageMetadata) {
              tokenUsage = {
                promptTokens: responseData.usageMetadata.promptTokenCount || 0,
                completionTokens: responseData.usageMetadata.candidatesTokenCount || 0,
                totalTokens: responseData.usageMetadata.totalTokenCount || 0
              };
            } else {
              // Estimate token usage if not provided
              const promptTokens = this.estimateTokenCount(prompt);
              const systemTokens = systemPrompt ? this.estimateTokenCount(systemPrompt) : 0;
              const responseTokens = this.estimateTokenCount(text);
              
              tokenUsage = {
                promptTokens: promptTokens + systemTokens,
                completionTokens: responseTokens,
                totalTokens: promptTokens + systemTokens + responseTokens
              };
            }
            
            console.log(`Successfully generated response using API key index ${this.currentKeyIndex}`);
            
            return { text, tokenUsage };
          },
          {
            provider: 'google',
            apiKey,
            metadata: {
              model: this.modelName,
              promptLength: prompt.length,
              systemPromptLength: systemPrompt?.length || 0
            }
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error with API key at index ${this.currentKeyIndex}: ${errorMessage}`);
        lastError = error as Error;
        
        // Check if this is a rate limit error
        const isRateLimitError = errorMessage.includes('rate limit') || 
                                errorMessage.includes('quota exceeded') ||
                                errorMessage.includes('429');

        // If it's a rate limit error, try another key
        // Otherwise, if we've tried all keys and come back to the initial one, break the loop
        if (!isRateLimitError && this.currentKeyIndex === initialKeyIndex && keysAttempted > 1) {
          throw error; // Rethrow non-rate-limit errors after trying all keys
        }
      }
    }
    
    // If we get here, all keys failed
    throw new Error(`All API keys failed. Last error: ${lastError?.message || "Unknown error"}`);
  }

  /**
   * Estimate token count for a given text
   * This is a rough estimate as the actual tokenization depends on the model
   * @param text The text to estimate tokens for
   * @returns Estimated token count
   */
  estimateTokenCount(text: string): number {
    // A very rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Set the model parameters
   * @param params Parameters to update
   */
  setParameters(params: Record<string, any>): void {
    if (params.temperature !== undefined) this.temperature = params.temperature;
    if (params.topP !== undefined) this.topP = params.topP;
    if (params.topK !== undefined) this.topK = params.topK;
    if (params.maxOutputTokens !== undefined) this.maxOutputTokens = params.maxOutputTokens;
  }

  /**
   * Get the current model name
   * @returns The model name
   */
  getModelName(): string {
    return this.modelName;
  }
  
  /**
   * Get the number of available API keys
   */
  getKeyCount(): number {
    return this.apiKeys.length;
  }
  
  /**
   * Add a new API key to the rotation
   * @param apiKey The API key to add
   * @returns Whether the key was successfully added
   */
  addApiKey(apiKey: string): boolean {
    if (!apiKey || this.apiKeys.includes(apiKey)) {
      return false;
    }
    
    this.apiKeys.push(apiKey);
    return true;
  }

  /**
   * Get the capabilities of this service
   */
  getCapabilities(): string[] {
    return [
      "text-generation",
      "code-generation",
      "chat",
      "reasoning"
    ];
  }

  /**
   * Get the usage limits for this service
   */
  getUsageLimits(): UsageLimits {
    return {
      requestsPerMinute: 15,
      requestsPerDay: 1500
    };
  }

  /**
   * Get the service type
   */
  getServiceType(): string {
    return "gemini";
  }
}