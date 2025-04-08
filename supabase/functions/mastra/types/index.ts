/**
 * Type definitions for the Mastra AI agent
 */

/**
 * Request payload for the Mastra agent
 */
export interface MastraRequest {
  /**
   * User query or message to be processed by the agent
   */
  query: string;
  
  /**
   * Optional context information to enhance agent responses
   */
  context?: Record<string, unknown>;
  
  /**
   * Optional conversation history for maintaining context
   */
  history?: Message[];
}

/**
 * Response payload from the Mastra agent
 */
export interface MastraResponse {
  /**
   * Text response from the agent
   */
  response: string;
  
  /**
   * Optional tool calls made during processing
   */
  toolCalls?: ToolCall[];
  
  /**
   * Optional metadata about the response
   */
  metadata?: Record<string, unknown>;
}

/**
 * Message in a conversation
 */
export interface Message {
  /**
   * Role of the message sender (user, assistant, system)
   */
  role: 'user' | 'assistant' | 'system';
  
  /**
   * Content of the message
   */
  content: string;
  
  /**
   * Optional tool calls made in this message
   */
  toolCalls?: ToolCall[];
}

/**
 * Tool call made by the agent
 */
export interface ToolCall {
  /**
   * Unique identifier for the tool call
   */
  id: string;
  
  /**
   * Name of the tool being called
   */
  name: string;
  
  /**
   * Arguments passed to the tool
   */
  arguments: Record<string, unknown>;
  
  /**
   * Optional result from the tool execution
   */
  result?: unknown;
}

/**
 * Tool definition for agent capabilities
 */
export interface Tool {
  /**
   * Unique identifier for the tool
   */
  id: string;
  
  /**
   * Human-readable description of the tool
   */
  description: string;
  
  /**
   * Function to execute the tool
   */
  execute: (params: ToolExecuteParams) => Promise<unknown>;
}

/**
 * Parameters for tool execution
 */
export interface ToolExecuteParams {
  /**
   * Context or arguments for the tool
   */
  context: Record<string, unknown>;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  /**
   * Error message
   */
  error: string;
  
  /**
   * Optional error code
   */
  code?: string;
  
  /**
   * Optional additional details
   */
  details?: Record<string, unknown>;
}