/**
 * LLM Provider Interface
 * Defines the interface for LLM providers
 */

import { 
  AssistantOptions, 
  Assistant, 
  ChatCompletionOptions, 
  ChatMessage, 
  CompletionOptions 
} from "../utils/types.ts";

/**
 * Interface for LLM providers
 */
export interface LLMProvider {
  /**
   * Get the provider name
   */
  getName(): string;
  
  /**
   * Get a completion from the LLM
   * @param prompt The prompt to send to the LLM
   * @param options Options for the completion
   */
  getCompletion(prompt: string, options?: CompletionOptions): Promise<string>;
  
  /**
   * Get a chat completion from the LLM
   * @param messages The messages to send to the LLM
   * @param options Options for the chat completion
   */
  getChatCompletion(messages: ChatMessage[], options?: ChatCompletionOptions): Promise<ChatMessage>;
  
  /**
   * Check if the provider supports assistants
   */
  supportsAssistants(): boolean;
  
  /**
   * Create an assistant (if supported)
   * @param options Options for the assistant
   */
  createAssistant?(options: AssistantOptions): Promise<Assistant>;
}