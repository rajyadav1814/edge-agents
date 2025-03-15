/**
 * Type definitions for the agent framework
 */

import { LLMProvider } from "../providers/llm-provider.ts";

/**
 * Agent options
 */
export interface AgentOptions {
  configPath?: string;
}

/**
 * Raw agent configuration from TOML
 */
export interface RawAgentConfig {
  agent: {
    name: string;
    description: string;
    default_flow: string;
  };
  providers: Record<string, {
    type: string;
    api_key_env?: string;
    api_key?: string;
    default_model?: string;
  }>;
  flows: Record<string, {
    description: string;
    steps: Record<string, {
      provider: string;
      model?: string;
      description?: string;
      system_prompt?: string;
      use_assistant?: boolean;
      assistant_instructions?: string;
      tools?: string[];
    }>;
    transitions: Record<string, string>;
  }>;
}

/**
 * Processed agent configuration
 */
export interface AgentConfig {
  name: string;
  description: string;
  defaultFlow: string;
  providers: Record<string, LLMProvider>;
  flows: Record<string, AgentFlow>;
}

/**
 * Agent flow
 */
export interface AgentFlow {
  name: string;
  description: string;
  steps: Record<string, AgentStep>;
  transitions: Record<string, string>;
}

/**
 * Agent step
 */
export interface AgentStep {
  name: string;
  provider: LLMProvider;
  model?: string;
  description?: string;
  systemPrompt?: string;
  useAssistant: boolean;
  assistantInstructions?: string;
  tools?: string[];
}

/**
 * Agent context
 */
export interface AgentContext {
  input?: string;
  output?: string;
  [key: string]: any;
}

/**
 * Chat message
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
}

/**
 * Tool call
 */
export interface ToolCall {
  id: string;
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Completion options
 */
export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

/**
 * Chat completion options
 */
export interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  tools?: ToolDefinition[];
}

/**
 * Assistant options
 */
export interface AssistantOptions {
  name: string;
  description?: string;
  model?: string;
  instructions?: string;
  tools?: ToolDefinition[];
}

/**
 * Assistant
 */
export interface Assistant {
  id: string;
  provider: string;
  name: string;
  model: string;
}

/**
 * Tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

/**
 * File to process
 */
export interface FileToProcess {
  path: string;
  content: string;
  originalContent: string;
  newContent?: string;
}

/**
 * Modification result
 */
export interface ModificationResult {
  path: string;
  success: boolean;
  originalContent?: string;
  modifiedContent?: string;
  diff?: string;
  error?: string;
}