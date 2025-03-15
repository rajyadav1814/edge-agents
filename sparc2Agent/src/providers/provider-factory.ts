/**
 * Provider Factory
 * Creates LLM providers based on configuration
 */

import { LLMProvider } from "./llm-provider.ts";
import { MockProvider, MockProviderOptions } from "./mock-provider.ts";
import { OpenAIProvider, OpenAIProviderOptions } from "./openai-provider.ts";
import { OpenRouterProvider, OpenRouterProviderOptions } from "./openrouter-provider.ts";

/**
 * Provider factory
 * Creates LLM providers based on configuration
 */
export class ProviderFactory {
  /**
   * Create a provider based on configuration
   * @param type Provider type
   * @param options Provider options
   * @returns LLM provider
   */
  static createProvider(type: string, options: any): LLMProvider {
    switch (type) {
      case "openai":
        return new OpenAIProvider(options as OpenAIProviderOptions);
      
      case "openrouter":
        return new OpenRouterProvider(options as OpenRouterProviderOptions);
      
      case "mock":
        return new MockProvider(options as MockProviderOptions);
      
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }
}