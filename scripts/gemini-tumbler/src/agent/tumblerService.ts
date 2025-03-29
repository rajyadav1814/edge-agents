/**
 * Service that rotates between different models
 */

import { GeminiClient } from "./geminiClient.ts";
import { GoogleGeminiClient } from "./googleGeminiClient.ts";
import { DirectGeminiClient } from "./directGeminiClient.ts";
import { 
  TumblerConfig, 
  ModelConfig, 
  TumblerRequest, 
  TumblerResponse,
  AnonymousContribution
} from "../types/index.ts";
import { ContributionManager } from "../utils/contributionManager.ts";

export class TumblerService {
  private config: TumblerConfig;
  private clients: Map<string, GeminiClient | GoogleGeminiClient | DirectGeminiClient> = new Map();
  private currentModelIndex = 0;
  private contributionManager: ContributionManager;

  constructor(config: TumblerConfig) {
    this.config = config;
    this.initializeClients();
    
    // Initialize contribution manager
    this.contributionManager = new ContributionManager({
      storageEnabled: true,
      storageLocation: "./contributions",
      contributionEndpoint: config.contributionEndpoint
    });
    
    // Start rotation timer if interval is set
    if (config.rotationInterval > 0) {
      setInterval(() => this.rotateModel(), config.rotationInterval);
    }
  }

  /**
   * Process a request through the tumbler
   * @param request The request to process
   * @returns The response from the selected model
   */
  async processRequest(request: TumblerRequest): Promise<TumblerResponse> {
    const startTime = Date.now();
    
    // Select model (use requested model or current rotation)
    const modelName = request.model || this.getCurrentModel().name;
    
    // Get client for the model
    const client = this.getClientForModel(modelName);
    if (!client) {
      throw new Error(`Model ${modelName} not found`);
    }
    
    // Apply request parameters if provided
    if (request.temperature !== undefined) {
      client.setParameters({ temperature: request.temperature });
    }
    
    if (request.maxTokens !== undefined) {
      client.setParameters({ maxOutputTokens: request.maxTokens });
    }
    
    // Generate response
    const { text, tokenUsage } = await client.generateText(
      request.prompt,
      request.systemPrompt
    );
    
    // Create response object
    const response: TumblerResponse = {
      content: text,
      model: modelName,
      tokenUsage,
      processingTime: Date.now() - startTime,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    };
    
    // Store contribution if consent is given
    if (request.contributionConsent && this.config.anonymousContribution) {
      await this.storeContribution(request, response);
    }
    
    return response;
  }

  /**
   * Store an anonymous contribution
   * @param request The original request
   * @param response The generated response
   */
  private async storeContribution(request: TumblerRequest, response: TumblerResponse): Promise<void> {
    const contribution: Omit<AnonymousContribution, "id"> = {
      prompt: request.prompt,
      response: response.content,
      model: response.model,
      timestamp: Date.now(),
      metadata: {
        processingTime: response.processingTime,
        tokenUsage: response.tokenUsage
      }
    };
    
    // Store the contribution
    await this.contributionManager.storeContribution(contribution);
  }

  /**
   * Rotate to the next model
   */
  private rotateModel(): void {
    this.currentModelIndex = (this.currentModelIndex + 1) % this.config.models.length;
    console.log(`Rotated to model: ${this.getCurrentModel().name}`);
  }

  /**
   * Get the current model configuration
   * @returns The current model configuration
   */
  private getCurrentModel(): ModelConfig {
    return this.config.models[this.currentModelIndex];
  }

  /**
   * Initialize clients for all configured models
   */
  private initializeClients(): void {
    for (const modelConfig of this.config.models) {
      // Get API keys from environment variables
      const primaryApiKey = modelConfig.apiKeyEnvVar 
        ? Deno.env.get(modelConfig.apiKeyEnvVar) || ""
        : Deno.env.get("GEMINI_API_KEY") || "";
      
      // Check for additional API keys
      const apiKeys: string[] = [primaryApiKey];
      
      // Look for additional keys with pattern GEMINI_API_KEY_2, GEMINI_API_KEY_3, etc.
      for (let i = 2; i <= 10; i++) {
        const additionalKey = Deno.env.get(`GEMINI_API_KEY_${i}`);
        if (additionalKey) {
          apiKeys.push(additionalKey);
        }
      }
      
      // Filter out empty keys
      const validApiKeys = apiKeys.filter(key => key.length > 0);
      
      if (validApiKeys.length === 0) {
        console.warn(`No API keys found for model ${modelConfig.name}`);
        continue;
      }
      
      // Create client based on provider and model
      if (modelConfig.provider === 'google') {
        // Check if this is an experimental model
        const isExperimentalModel = modelConfig.name.includes("exp");
        
        if (isExperimentalModel) {
          // Use DirectGeminiClient for experimental models
          console.log(`Initializing DirectGeminiClient for experimental model ${modelConfig.name}`);
          const client = new DirectGeminiClient({
            apiKeys: validApiKeys,
            modelName: modelConfig.name,
            maxOutputTokens: modelConfig.maxOutputTokens
          });
          
          this.clients.set(modelConfig.name, client);
        } else if (validApiKeys.length > 1) {
          // Use the GoogleGeminiClient with multiple keys for non-experimental models
          console.log(`Initializing GoogleGeminiClient with ${validApiKeys.length} API keys for model ${modelConfig.name}`);
          const client = new GoogleGeminiClient({
            apiKeys: validApiKeys,
            modelName: modelConfig.name,
            maxOutputTokens: modelConfig.maxOutputTokens
          });
          
          this.clients.set(modelConfig.name, client);
        } else {
          // Use the original GeminiClient with a single key for non-experimental models
          console.log(`Initializing GeminiClient with single API key for model ${modelConfig.name}`);
          const client = new GeminiClient({
            apiKey: validApiKeys[0],
            modelName: modelConfig.name,
            maxOutputTokens: modelConfig.maxOutputTokens
          });
          
          this.clients.set(modelConfig.name, client);
        }
      }
      
      // Other providers would be implemented here
    }
    
    // Set initial model index to the default model if specified
    if (this.config.defaultModel) {
      const defaultIndex = this.config.models.findIndex(m => m.name === this.config.defaultModel);
      if (defaultIndex >= 0) {
        this.currentModelIndex = defaultIndex;
      }
    }
  }

  /**
   * Get a client for a specific model
   * @param modelName The name of the model
   * @returns The client for the model, or undefined if not found
   */
  private getClientForModel(modelName: string): GeminiClient | GoogleGeminiClient | DirectGeminiClient | undefined {
    return this.clients.get(modelName);
  }

  /**
   * Get information about all available models
   * @returns Information about all available models
   */
  getAvailableModels(): Array<{
    name: string;
    provider: string;
    capabilities?: string[];
    isDefault: boolean;
  }> {
    return this.config.models.map(model => ({
      name: model.name,
      provider: model.provider,
      capabilities: model.capabilities,
      isDefault: model.name === this.config.defaultModel
    }));
  }

  /**
   * Get the contribution manager
   * @returns The contribution manager
   */
  getContributionManager(): ContributionManager {
    return this.contributionManager;
  }
}