/**
 * Enhanced Gemini client using the official Google Generative AI SDK
 * with support for multiple API keys and key rotation
 */

import { GoogleGenerativeAI, GenerativeModel, GenerationConfig } from "@google/generative-ai";
import { GeminiConfig, TokenUsage } from "../types/index.ts";
import { GoogleAIClient, UsageLimits } from "../types/googleAIClient.ts";
import { interceptRequest, selectBestApiKey } from "../utils/responseInterceptor.ts";

export class GoogleGeminiClient implements GoogleAIClient {
  private apiKeys: string[];
  private currentKeyIndex = 0;
  private modelName: string;
  private temperature: number;
  private topP: number;
  private topK: number;
  private maxOutputTokens: number;
  private models: Map<string, GenerativeModel> = new Map();

  constructor(config: GeminiConfig & { apiKeys?: string[] }) {
    // Handle single API key or multiple keys
    if (config.apiKeys && config.apiKeys.length > 0) {
      this.apiKeys = config.apiKeys;
    } else if (config.apiKey) {
      this.apiKeys = [config.apiKey];
    } else {
      throw new Error("At least one API key is required for GoogleGeminiClient");
    }
    
    this.modelName = config.modelName;
    this.temperature = config.temperature ?? 0.7;
    this.topP = config.topP ?? 0.95;
    this.topK = config.topK ?? 40;
    this.maxOutputTokens = config.maxOutputTokens ?? 2048;
    
    // Initialize models for each API key
    this.initializeModels();
  }

  /**
   * Initialize Gemini models for each API key
   */
  private initializeModels(): void {
    for (const apiKey of this.apiKeys) {
      if (!apiKey) {
        console.warn(`Empty API key provided, skipping initialization for this key`);
        continue;
      }
      
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: this.modelName,
          generationConfig: this.getGenerationConfig(),
        });
        
        // Store the model instance with its API key as identifier
        this.models.set(apiKey, model);
      } catch (error) {
        console.error(`Failed to initialize model with API key: ${error}`);
      }
    }
    
    if (this.models.size === 0) {
      throw new Error("Failed to initialize any models. Check your API keys.");
    }
  }

  /**
   * Get the generation configuration for the model
   */
  private getGenerationConfig(): GenerationConfig {
    return {
      temperature: this.temperature,
      topP: this.topP,
      topK: this.topK,
      maxOutputTokens: this.maxOutputTokens,
    };
  }

  /**
   * Get the next API key in rotation
   * @returns The next API key
   */
  private getNextApiKey(): string {
    const validKeys = Array.from(this.models.keys());
    if (validKeys.length === 0) {
      throw new Error("No valid API keys available");
    }
    
    // Try to select the best key using the rate limit manager
    const bestKey = selectBestApiKey('google', validKeys);
    if (bestKey && validKeys.includes(bestKey)) {
      return bestKey;
    }
    
    // Fall back to round-robin if no best key was found or rate limiting is not initialized
    this.currentKeyIndex = (this.currentKeyIndex + 1) % validKeys.length;
    return validKeys[this.currentKeyIndex];
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
   * Generate a response from the Gemini model
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
    while (keysAttempted < this.models.size) {
      try {
        // Get the next API key to try
        const apiKey = this.getNextApiKey();
        keysAttempted++;

        // Use the interceptRequest function to wrap the API call
        return await interceptRequest(
          async () => {
            const model = this.models.get(apiKey);
            
            if (!model) {
              throw new Error(`Model not available for API key`);
            }
            
            // Prepare the chat session
            const chat = model.startChat();
            
            // Add system prompt if provided
            if (systemPrompt) {
              await chat.sendMessage(systemPrompt);
            }
            
            // Send the user prompt and get response
            const result = await chat.sendMessage(prompt);
            const text = result.response.text();
            
            // Estimate token usage (the SDK doesn't provide token counts directly)
            const promptTokens = this.estimateTokenCount(prompt);
            const systemTokens = systemPrompt ? this.estimateTokenCount(systemPrompt) : 0;
            const responseTokens = this.estimateTokenCount(text);
            
            const tokenUsage: TokenUsage = {
              promptTokens: promptTokens + systemTokens,
              completionTokens: responseTokens,
              totalTokens: promptTokens + systemTokens + responseTokens
            };
            
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
    
    // Reinitialize models with new parameters
    this.initializeModels();
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
    return this.models.size;
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
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: this.getGenerationConfig(),
      });
      
      this.apiKeys.push(apiKey);
      this.models.set(apiKey, model);
      return true;
    } catch (error) {
      console.error(`Failed to add API key: ${error}`);
      return false;
    }
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