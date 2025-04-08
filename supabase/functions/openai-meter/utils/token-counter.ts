/**
 * Token Counter Utility
 * Counts tokens in OpenAI API requests
 */
import { OpenAIRequest, ChatMessage } from "../api-contract.ts";

/**
 * Token count result
 */
export interface TokenCountResult {
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
}

/**
 * Token count
 */
export interface TokenCount {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

/**
 * Token Counter
 * Counts tokens in OpenAI API requests
 */
export class TokenCounter {
  /**
   * Count tokens in an array of chat messages
   * @param messages Array of chat messages
   * @returns Estimated token count
   */
  public async countTokens(messages: ChatMessage[]): Promise<number> {
    if (!messages || messages.length === 0) {
      return 0;
    }
    
    let tokenCount = 0;
    
    // Count tokens in each message
    for (const message of messages) {
      tokenCount += TokenCounter.estimateMessageTokens(message);
    }
    
    // Add base tokens for the conversation structure
    tokenCount += 10;
    
    return tokenCount;
  }

  /**
   * Count tokens in an OpenAI API request
   * @param request OpenAI API request
   * @returns Token count result
   */
  public static countTokens(request: OpenAIRequest): TokenCountResult {
    // Estimate prompt tokens
    const promptTokens = this.estimatePromptTokens(request);
    
    // Estimate completion tokens based on max_tokens or a default value
    const completionTokens = request.max_tokens || 256;
    
    // Calculate total tokens
    const totalTokens = promptTokens + completionTokens;
    
    return {
      totalTokens,
      promptTokens,
      completionTokens,
    };
  }
  
  /**
   * Alias for countTokens for backward compatibility
   * @param request OpenAI API request
   * @returns Token count result
   */
  public static estimateRequestTokens(request: OpenAIRequest): TokenCountResult {
    return this.countTokens(request);
  }
  
  /**
   * Alias for countResponseTokens for backward compatibility
   * @param response OpenAI API response
   * @returns Token count
   */
  public static extractResponseTokens(response: any): number {
    return this.countResponseTokens(response);
  }
  
  /**
   * Calculate cost based on token usage
   * @param promptTokens Number of prompt tokens
   * @param completionTokens Number of completion tokens
   * @param model Model name
   * @returns Cost in USD
   */
  public static calculateCost(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    // Default rates for GPT-3.5-turbo
    let promptRate = 0.0015; // per 1K tokens
    let completionRate = 0.002; // per 1K tokens
    
    // Adjust rates based on model
    if (model.includes("gpt-4")) {
      promptRate = 0.03; // per 1K tokens
      completionRate = 0.06; // per 1K tokens
    }
    
    // Calculate costs
    const promptCost = (promptTokens / 1000) * promptRate;
    const completionCost = (completionTokens / 1000) * completionRate;
    
    // Return total cost
    return promptCost + completionCost;
  }
  
  /**
   * Estimate prompt tokens in an OpenAI API request
   * @param request OpenAI API request
   * @returns Estimated prompt tokens
   */
  private static estimatePromptTokens(request: OpenAIRequest): number {
    let tokenCount = 0;
    
    // Count tokens in messages
    for (const message of request.messages) {
      tokenCount += this.estimateMessageTokens(message);
    }
    
    // Add tokens for functions if present
    if (request.functions) {
      for (const func of request.functions) {
        // Function name
        tokenCount += this.estimateTokensFromText(func.name);
        
        // Function description (if present)
        if (func.description) {
          tokenCount += this.estimateTokensFromText(func.description);
        }
        
        // Function parameters (approximate)
        tokenCount += this.estimateTokensFromText(
          JSON.stringify(func.parameters)
        );
      }
    }
    
    // Add tokens for function_call if present
    if (request.function_call && typeof request.function_call === "object") {
      tokenCount += this.estimateTokensFromText(request.function_call.name);
    }
    
    // Add base tokens for the request structure
    tokenCount += 10;
    
    return tokenCount;
  }
  
  /**
   * Estimate tokens in a chat message
   * @param message Chat message
   * @returns Estimated tokens
   */
  private static estimateMessageTokens(message: ChatMessage): number {
    let tokenCount = 0;
    
    // Role
    tokenCount += 4; // Approximate tokens for role
    
    // Content
    if (message.content) {
      tokenCount += this.estimateTokensFromText(message.content);
    }
    
    // Name (if present)
    if (message.name) {
      tokenCount += this.estimateTokensFromText(message.name);
    }
    
    // Function call (if present)
    if (message.function_call) {
      tokenCount += this.estimateTokensFromText(message.function_call.name);
      tokenCount += this.estimateTokensFromText(message.function_call.arguments);
    }
    
    return tokenCount;
  }
  
  /**
   * Estimate tokens in text
   * @param text Text to estimate tokens for
   * @returns Estimated tokens
   */
  private static estimateTokensFromText(text: string): number {
    // Simple estimation: ~4 characters per token
    // This is a rough approximation; actual tokenization is more complex
    return Math.ceil(text.length / 4);
  }
  
  /**
   * Count tokens in a response
   * @param response OpenAI API response
   * @returns Token count
   */
  public static countResponseTokens(response: any): number {
    if (!response || !response.choices || !response.choices[0]) {
      return 0;
    }
    
    const choice = response.choices[0];
    
    if (choice.message && choice.message.content) {
      return this.estimateTokensFromText(choice.message.content);
    }
    
    return 0;
  }
}