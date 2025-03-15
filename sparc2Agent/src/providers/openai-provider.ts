/**
 * OpenAI Provider
 * Implementation of the LLM provider interface for OpenAI
 */

import { 
  Assistant, 
  AssistantOptions, 
  ChatCompletionOptions, 
  ChatMessage, 
  CompletionOptions 
} from "../utils/types.ts";
import { LLMProvider } from "./llm-provider.ts";

/**
 * OpenAI provider options
 */
export interface OpenAIProviderOptions {
  apiKeyEnv?: string;
  apiKey?: string;
  defaultModel?: string;
}

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private defaultModel: string;
  
  /**
   * Create a new OpenAI provider
   * @param options Provider options
   */
  constructor(options: OpenAIProviderOptions) {
    // Get API key from environment variable or options
    const apiKey = Deno.env.get(options.apiKeyEnv || "OPENAI_API_KEY") || options.apiKey;
    
    if (!apiKey) {
      throw new Error(`API key not found for OpenAI provider (${options.apiKeyEnv || "OPENAI_API_KEY"})`);
    }
    
    this.apiKey = apiKey;
    this.defaultModel = options.defaultModel || "gpt-4o";
  }
  
  /**
   * Get the provider name
   */
  getName(): string {
    return "openai";
  }
  
  /**
   * Get a completion from the LLM
   * @param prompt The prompt to send to the LLM
   * @param options Options for the completion
   */
  async getCompletion(prompt: string, options?: CompletionOptions): Promise<string> {
    const model = options?.model || this.defaultModel;
    const maxTokens = options?.maxTokens || 1000;
    const temperature = options?.temperature || 0.7;
    
    try {
      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          prompt,
          max_tokens: maxTokens,
          temperature
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      return data.choices[0]?.text || "";
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("OpenAI completion error:", errorMessage);
      throw error;
    }
  }
  
  /**
   * Get a chat completion from the LLM
   * @param messages The messages to send to the LLM
   * @param options Options for the chat completion
   */
  async getChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatMessage> {
    const model = options?.model || this.defaultModel;
    const temperature = options?.temperature || 0.7;
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          tools: options?.tools
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        role: "assistant" as const,
        content: data.choices[0]?.message?.content || "",
        tool_calls: data.choices[0]?.message?.tool_calls
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("OpenAI chat completion error:", errorMessage);
      throw error;
    }
  }
  
  /**
   * Check if the provider supports assistants
   */
  supportsAssistants(): boolean {
    return true;
  }
  
  /**
   * Create an assistant
   * @param options Options for the assistant
   */
  async createAssistant(options: AssistantOptions): Promise<Assistant> {
    try {
      const response = await fetch("https://api.openai.com/v1/assistants", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "OpenAI-Beta": "assistants=v1"
        },
        body: JSON.stringify({
          name: options.name,
          description: options.description,
          model: options.model || this.defaultModel,
          instructions: options.instructions,
          tools: options.tools?.map(tool => ({
            type: "function",
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters
            }
          }))
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        provider: this.getName(),
        name: data.name,
        model: data.model
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("OpenAI create assistant error:", errorMessage);
      throw error;
    }
  }
}