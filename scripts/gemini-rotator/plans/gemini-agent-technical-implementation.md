# Gemini Agent Technical Implementation Plan

## Core Components Design

This document provides detailed technical specifications for implementing the Gemini agent and edge function system, with a focus on code structure, interfaces, and testing.

## 1. Type Definitions

### 1.1 Agent Types

```typescript
// File: types/agent.ts

export interface AgentConfig {
  modelProvider: string;               // Default: google/gemini-2.5-pro-experimental
  thinkingProvider?: string;           // Default: google/gemini-2.0-flash
  documentationProvider?: string;      // Default: google/gemini-2.0-pro
  apiKey: string;                      // API key for model access
  maxTokens?: number;                  // Maximum tokens for response
  temperature?: number;                // Temperature for generation
  topP?: number;                       // Top-p sampling parameter
  contextWindow?: number;              // Maximum context window size
  defaultMode?: AgentMode;             // Default operational mode
  tools?: ToolDefinition[];            // Available tools
  systemPrompt?: string;               // System prompt template
}

export type AgentMode = 'code' | 'architect' | 'document' | 'analyze';

export interface AgentContext {
  conversation: ConversationEntry[];   // Conversation history
  memory: MemoryBank;                  // Long-term memory
  currentMode: AgentMode;              // Current operational mode
  activeTools: string[];               // Currently active tools
  projectContext?: ProjectContext;     // Project-specific context
}

export interface ConversationEntry {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface AgentResponse {
  content: string;                     // Main response content
  mode: AgentMode;                     // Mode used for response
  toolResults?: ToolResult[];          // Results from tool usage
  metadata: ResponseMetadata;          // Response metadata
}
```

### 1.2 Tool Types

```typescript
// File: types/tools.ts

export interface ToolDefinition {
  name: string;                        // Tool name
  description: string;                 // Tool description
  parameters: ToolParameter[];         // Tool parameters
  required?: boolean;                  // Is tool required
}

export interface ToolParameter {
  name: string;                        // Parameter name
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;                 // Parameter description
  required: boolean;                   // Is parameter required
}

export interface ToolResult {
  toolName: string;                    // Tool name
  result: any;                         // Tool execution result
  error?: string;                      // Error if execution failed
  metadata?: Record<string, any>;      // Additional metadata
}
```

### 1.3 Edge Function Types

```typescript
// File: types/edge.ts

export interface EdgeFunctionRequest {
  input: string;                       // User input
  context?: Partial<AgentContext>;     // Context information
  config?: Partial<AgentConfig>;       // Configuration overrides
  metadata?: Record<string, any>;      // Request metadata
}

export interface EdgeFunctionResponse {
  response: AgentResponse;             // Agent response
  error?: ErrorResponse;               // Error information
  metadata: EdgeResponseMetadata;      // Response metadata
}

export interface ErrorResponse {
  code: string;                        // Error code
  message: string;                     // Error message
  details?: any;                       // Error details
}
```

## 2. Agent Implementation

### 2.1 Agent Core

```typescript
// File: agent/geminiAgent.ts

import { 
  AgentConfig, 
  AgentContext, 
  AgentResponse, 
  AgentMode,
  ConversationEntry,
  ToolResult
} from '../types/agent.ts';
import { ToolDefinition } from '../types/tools.ts';
import { GeminiClient } from './geminiClient.ts';
import { ContextManager } from './contextManager.ts';
import { ToolManager } from './toolManager.ts';

export class GeminiAgent {
  private config: AgentConfig;
  private context: AgentContext;
  private geminiClient: GeminiClient;
  private contextManager: ContextManager;
  private toolManager: ToolManager;
  private initialized = false;

  constructor() {
    // Initialize with empty values, will be set in initialize()
    this.config = {} as AgentConfig;
    this.context = {} as AgentContext;
    this.geminiClient = {} as GeminiClient;
    this.contextManager = {} as ContextManager;
    this.toolManager = {} as ToolManager;
  }

  /**
   * Initialize the agent with configuration
   */
  async initialize(config: AgentConfig): Promise<void> {
    this.config = config;
    
    // Initialize client and managers
    this.geminiClient = new GeminiClient(config);
    this.contextManager = new ContextManager();
    this.toolManager = new ToolManager(config.tools || []);
    
    // Initialize context
    this.context = {
      conversation: [],
      memory: {
        decisions: [],
        codeContext: [],
        projectKnowledge: []
      },
      currentMode: config.defaultMode || 'code',
      activeTools: this.toolManager.getDefaultToolNames()
    };
    
    this.initialized = true;
  }

  /**
   * Process user input and generate a response
   */
  async process(input: string, contextUpdate?: Partial<AgentContext>): Promise<AgentResponse> {
    if (!this.initialized) {
      throw new Error('Agent not initialized');
    }
    
    // Update context if provided
    if (contextUpdate) {
      this.updateContext(contextUpdate);
    }
    
    // Add user input to conversation
    this.addToConversation('user', input);
    
    // Determine if mode should change based on input
    this.detectAndUpdateMode(input);
    
    // Prepare context for the model
    const processedContext = this.contextManager.prepareContext(this.context);
    
    // Get available tools for current mode
    const availableTools = this.toolManager.getToolsForMode(this.context.currentMode);
    
    // Get response from model
    const startTime = Date.now();
    const modelResponse = await this.geminiClient.generateResponse(
      input,
      processedContext,
      availableTools
    );
    
    // Process tool calls if any
    let toolResults: ToolResult[] = [];
    if (modelResponse.toolCalls && modelResponse.toolCalls.length > 0) {
      toolResults = await this.toolManager.executeToolCalls(modelResponse.toolCalls);
    }
    
    // Add assistant response to conversation
    this.addToConversation('assistant', modelResponse.content);
    
    // Prepare response
    const response: AgentResponse = {
      content: modelResponse.content,
      mode: this.context.currentMode,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      metadata: {
        processingTime: Date.now() - startTime,
        tokenUsage: modelResponse.usage || { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        modelProvider: this.config.modelProvider,
        timestamp: Date.now()
      }
    };
    
    return response;
  }

  /**
   * Update the agent's context
   */
  updateContext(contextUpdate: Partial<AgentContext>): void {
    this.context = {
      ...this.context,
      ...contextUpdate
    };
  }

  /**
   * Switch the agent's operational mode
   */
  switchMode(newMode: AgentMode): void {
    if (this.context.currentMode !== newMode) {
      this.context.currentMode = newMode;
      
      // Update active tools for the new mode
      this.context.activeTools = this.toolManager.getToolsForMode(newMode)
        .map(tool => tool.name);
    }
  }

  /**
   * Add an entry to the conversation history
   */
  private addToConversation(role: 'user' | 'assistant' | 'system' | 'tool', content: string): void {
    this.context.conversation.push({
      role,
      content,
      timestamp: Date.now(),
      metadata: { mode: this.context.currentMode }
    });
  }

  /**
   * Detect if mode should change based on input
   */
  private detectAndUpdateMode(input: string): void {
    // Check for intent-based triggers from .clinerules
    const codeIntents = ['implement', 'create', 'build', 'fix'];
    const architectIntents = ['design', 'structure', 'plan'];
    
    // Check if input matches any code intents
    if (codeIntents.some(intent => input.toLowerCase().includes(intent))) {
      this.switchMode('code');
      return;
    }
    
    // Check if input matches any architect intents
    if (architectIntents.some(intent => input.toLowerCase().includes(intent))) {
      this.switchMode('architect');
      return;
    }
  }
}
```

## 3. Edge Function Implementation

```typescript
// File: edge/geminiEdgeFunction.ts

import { 
  EdgeFunctionRequest, 
  EdgeFunctionResponse, 
  ErrorResponse 
} from '../types/edge.ts';
import { AgentConfig } from '../types/agent.ts';
import { GeminiAgent } from '../agent/geminiAgent.ts';
import { v4 as uuidv4 } from 'https://deno.land/std/uuid/mod.ts';

// Default configuration
const DEFAULT_CONFIG: Partial<AgentConfig> = {
  modelProvider: 'google/gemini-2.5-pro-experimental',
  thinkingProvider: 'google/gemini-2.0-flash',
  documentationProvider: 'google/gemini-2.0-pro',
  temperature: 0.7,
  topP: 0.95,
  contextWindow: 4000,
  defaultMode: 'code'
};

/**
 * Main edge function handler
 */
export default async function(req: Request): Promise<Response> {
  const startTime = Date.now();
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return createErrorResponse(
        '405', 
        'Method Not Allowed', 
        'Only POST requests are supported',
        startTime
      );
    }
    
    // Parse request body
    let requestData: EdgeFunctionRequest;
    try {
      requestData = await req.json();
    } catch (error) {
      return createErrorResponse(
        '400', 
        'Bad Request', 
        'Invalid JSON in request body',
        startTime
      );
    }
    
    // Validate request
    if (!requestData.input) {
      return createErrorResponse(
        '400', 
        'Bad Request', 
        'Missing required field: input',
        startTime
      );
    }
    
    // Get API key from environment or request
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      return createErrorResponse(
        '500', 
        'Server Error', 
        'API key not configured',
        startTime
      );
    }
    
    // Merge configuration
    const config: AgentConfig = {
      ...DEFAULT_CONFIG,
      ...requestData.config,
      apiKey
    } as AgentConfig;
    
    // Initialize agent
    const agent = new GeminiAgent();
    await agent.initialize(config);
    
    // Process request
    const response = await agent.process(
      requestData.input,
      requestData.context
    );
    
    // Create response
    const edgeResponse: EdgeFunctionResponse = {
      response,
      metadata: {
        requestId: uuidv4(),
        processingTime: Date.now() - startTime,
        timestamp: Date.now(),
        version: '1.0.0'
      }
    };
    
    return new Response(JSON.stringify(edgeResponse), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
  } catch (error) {
    console.error('Error processing request:', error);
    
    return createErrorResponse(
      '500',
      'Internal Server Error',
      error instanceof Error ? error.message : 'Unknown error',
      startTime
    );
  }
}

/**
 * Create an error response
 */
function createErrorResponse(
  code: string,
  message: string,
  details: any,
  startTime: number
): Response {
  const errorResponse: EdgeFunctionResponse = {
    response: {
      content: 'Error processing request',
      mode: 'code',
      metadata: {
        processingTime: Date.now() - startTime,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        modelProvider: '',
        timestamp: Date.now()
      }
    },
    error: {
      code,
      message,
      details
    },
    metadata: {
      requestId: uuidv4(),
      processingTime: Date.now() - startTime,
      timestamp: Date.now(),
      version: '1.0.0'
    }
  };
  
  return new Response(JSON.stringify(errorResponse), {
    status: code === '400' || code === '405' ? parseInt(code) : 500,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
```

## 4. Unit Tests

### 4.1 Agent Tests

```typescript
// File: tests/agent/geminiAgent.test.ts

import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts';
import { GeminiAgent } from '../../agent/geminiAgent.ts';
import { AgentConfig } from '../../types/agent.ts';

// Mock dependencies
import { MockGeminiClient } from '../mocks/mockGeminiClient.ts';

// Replace actual implementations with mocks
// @ts-ignore: Override for testing
GeminiAgent.prototype.geminiClient = new MockGeminiClient();

const mockConfig: AgentConfig = {
  apiKey: 'test-api-key',
  modelProvider: 'google/gemini-2.5-pro-experimental',
  defaultMode: 'code'
};

Deno.test('GeminiAgent - initialization', async () => {
  const agent = new GeminiAgent();
  await agent.initialize(mockConfig);
  
  assertEquals(agent.isInitialized(), true);
  
  const context = agent.getContext();
  assertEquals(context.currentMode, 'code');
  assertExists(context.conversation);
  assertExists(context.memory);
});

Deno.test('GeminiAgent - process input', async () => {
  const agent = new GeminiAgent();
  await agent.initialize(mockConfig);
  
  const response = await agent.process('Implement a function to calculate factorial');
  
  assertExists(response);
  assertExists(response.content);
  assertEquals(response.mode, 'code');
  assertExists(response.metadata);
  assertExists(response.metadata.tokenUsage);
});

Deno.test('GeminiAgent - mode switching', async () => {
  const agent = new GeminiAgent();
  await agent.initialize(mockConfig);
  
  // Test intent-based mode switch
  await agent.process('Implement a sorting algorithm');
  assertEquals(agent.getContext().currentMode, 'code');
  
  await agent.process('Design a system architecture for e-commerce');
  assertEquals(agent.getContext().currentMode, 'architect');
});
```

### 4.2 Edge Function Tests

```typescript
// File: tests/edge/geminiEdgeFunction.test.ts

import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts';
import handleRequest from '../../edge/geminiEdgeFunction.ts';

// Mock environment variables
Deno.env.set('GEMINI_API_KEY', 'test-api-key');

Deno.test('Edge Function - valid request', async () => {
  const request = new Request('https://example.com/agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      input: 'Implement a factorial function'
    })
  });
  
  const response = await handleRequest(request);
  assertEquals(response.status, 200);
  
  const responseData = await response.json();
  assertExists(responseData.response);
  assertExists(responseData.response.content);
  assertExists(responseData.metadata);
  assertExists(responseData.metadata.requestId);
});

Deno.test('Edge Function - invalid method', async () => {
  const request = new Request('https://example.com/agent', {
    method: 'GET'
  });
  
  const response = await handleRequest(request);
  assertEquals(response.status, 405);
  
  const responseData = await response.json();
  assertExists(responseData.error);
  assertEquals(responseData.error.code, '405');
});

Deno.test('Edge Function - missing input', async () => {
  const request = new Request('https://example.com/agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });
  
  const response = await handleRequest(request);
  assertEquals(response.status, 400);
  
  const responseData = await response.json();
  assertExists(responseData.error);
  assertEquals(responseData.error.code, '400');
});
```

## 5. Implementation Roadmap

1. **Phase 1: Core Implementation**
   - Implement type definitions
   - Create GeminiClient for API communication
   - Develop basic agent functionality
   - Implement edge function handler

2. **Phase 2: Tool Integration**
   - Implement tool definitions
   - Create tool execution framework
   - Integrate tools with agent

3. **Phase 3: Context Management**
   - Implement context processing
   - Create memory management
   - Develop mode switching logic

4. **Phase 4: Testing**
   - Create unit tests for all components
   - Implement integration tests
   - Develop end-to-end tests

5. **Phase 5: Deployment**
   - Configure deployment pipeline
   - Set up environment variables
   - Create documentation
