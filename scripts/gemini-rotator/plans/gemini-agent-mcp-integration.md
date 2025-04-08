# Gemini Agent MCP Integration Plan

## Overview

This document outlines the implementation plan for integrating the Gemini agent with the Model Control Panel (MCP) infrastructure. The MCP integration enables the agent to access external tools, resources, and services through a standardized interface.

## MCP Architecture

The MCP (Model Control Panel) serves as a middleware layer between the agent and external systems, providing:

1. **Tool Execution**: Standardized interface for invoking tools
2. **Resource Access**: Unified access to data resources
3. **Context Management**: Centralized context storage and retrieval
4. **Security**: Authentication and authorization for tool access

## Implementation Components

### 1. MCP Client

```typescript
// File: agent/mcpClient.ts

import { MCPConfig, MCPToolRequest, MCPResourceRequest, MCPResponse } from '../types/mcp.ts';

/**
 * Client for interacting with MCP servers
 */
export class MCPClient {
  private serverUrl: string;
  private authToken: string;
  private features: string[];
  
  constructor(config: MCPConfig) {
    this.serverUrl = config.serverUrl;
    this.authToken = config.authToken;
    this.features = config.features || [];
  }
  
  /**
   * Invoke a tool through MCP
   */
  async invokeTool(request: MCPToolRequest): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.serverUrl}/tools/${request.toolName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          serverName: request.serverName,
          arguments: request.arguments
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`MCP tool invocation error: ${errorData.error || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error invoking MCP tool:', error);
      return {
        result: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Access a resource through MCP
   */
  async accessResource(request: MCPResourceRequest): Promise<MCPResponse> {
    try {
      const response = await fetch(`${this.serverUrl}/resources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`
        },
        body: JSON.stringify({
          serverName: request.serverName,
          uri: request.uri
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`MCP resource access error: ${errorData.error || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error accessing MCP resource:', error);
      return {
        result: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Check if MCP server is available
   */
  async checkAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      return response.ok;
    } catch (error) {
      console.error('Error checking MCP availability:', error);
      return false;
    }
  }
  
  /**
   * Get available tools from MCP
   */
  async getAvailableTools(): Promise<string[]> {
    try {
      const response = await fetch(`${this.serverUrl}/tools`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.authToken}`
        }
      });
      
      if (!response.ok) {
        return [];
      }
      
      const data = await response.json();
      return data.tools || [];
    } catch (error) {
      console.error('Error getting available MCP tools:', error);
      return [];
    }
  }
}
```

### 2. MCP-Enabled Agent

```typescript
// File: agent/mcpEnabledAgent.ts

import { GeminiAgent } from './geminiAgent.ts';
import { MCPClient } from './mcpClient.ts';
import { AgentConfig, AgentContext, AgentResponse } from '../types/agent.ts';
import { MCPConfig, MCPToolRequest, MCPResourceRequest } from '../types/mcp.ts';
import { ToolResult } from '../types/tools.ts';

/**
 * Extension of GeminiAgent with MCP integration
 */
export class MCPEnabledAgent extends GeminiAgent {
  private mcpClient: MCPClient;
  private mcpAvailable: boolean = false;
  private mcpTools: string[] = [];
  
  /**
   * Initialize the agent with configuration
   */
  async initialize(config: AgentConfig & { mcp?: MCPConfig }): Promise<void> {
    // Initialize base agent
    await super.initialize(config);
    
    // Initialize MCP client if config provided
    if (config.mcp) {
      this.mcpClient = new MCPClient(config.mcp);
      
      // Check MCP availability
      this.mcpAvailable = await this.mcpClient.checkAvailability();
      
      if (this.mcpAvailable) {
        // Get available tools
        this.mcpTools = await this.mcpClient.getAvailableTools();
        
        // Log MCP initialization
        console.log(`MCP initialized with ${this.mcpTools.length} available tools`);
      } else {
        console.warn('MCP server is not available');
      }
    }
  }
  
  /**
   * Process user input with MCP integration
   */
  async process(input: string, contextUpdate?: Partial<AgentContext>): Promise<AgentResponse> {
    // If MCP is available, check if we need to fetch additional context
    if (this.mcpAvailable && !contextUpdate?.projectContext) {
      try {
        // Try to fetch project context from MCP
        const projectContextResponse = await this.mcpClient.accessResource({
          serverName: 'sparc2-mcp',
          uri: 'resource://project-context'
        });
        
        if (projectContextResponse.result) {
          // Merge with context update
          contextUpdate = {
            ...contextUpdate,
            projectContext: projectContextResponse.result
          };
        }
      } catch (error) {
        console.warn('Failed to fetch project context from MCP:', error);
      }
    }
    
    // Process with base agent
    return super.process(input, contextUpdate);
  }
  
  /**
   * Override tool execution to use MCP when appropriate
   */
  protected async executeToolCall(toolName: string, parameters: Record<string, any>): Promise<ToolResult> {
    // Check if this is an MCP tool
    if (this.mcpAvailable && this.mcpTools.includes(toolName)) {
      // Execute through MCP
      const mcpResponse = await this.mcpClient.invokeTool({
        serverName: 'sparc2-mcp',
        toolName,
        arguments: parameters
      });
      
      return {
        toolName,
        result: mcpResponse.result,
        error: mcpResponse.error,
        metadata: mcpResponse.metadata
      };
    }
    
    // Fall back to local tool execution
    return super.executeToolCall(toolName, parameters);
  }
  
  /**
   * Access an MCP resource
   */
  async accessMCPResource(uri: string): Promise<any> {
    if (!this.mcpAvailable) {
      throw new Error('MCP is not available');
    }
    
    const response = await this.mcpClient.accessResource({
      serverName: 'sparc2-mcp',
      uri
    });
    
    if (response.error) {
      throw new Error(`Failed to access MCP resource: ${response.error}`);
    }
    
    return response.result;
  }
  
  /**
   * Check if MCP is available
   */
  isMCPAvailable(): boolean {
    return this.mcpAvailable;
  }
  
  /**
   * Get available MCP tools
   */
  getAvailableMCPTools(): string[] {
    return this.mcpTools;
  }
}
```

### 3. MCP Tool Adapters

```typescript
// File: agent/mcpToolAdapters.ts

import { ToolDefinition, ToolParameter } from '../types/tools.ts';

/**
 * Convert MCP tool definitions to agent tool definitions
 */
export function convertMCPToolDefinitions(mcpTools: any[]): ToolDefinition[] {
  return mcpTools.map(mcpTool => ({
    name: mcpTool.name,
    description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
    parameters: convertMCPParameters(mcpTool.parameters || {}),
    required: mcpTool.required || false,
    examples: mcpTool.examples || []
  }));
}

/**
 * Convert MCP parameter definitions to agent parameter definitions
 */
function convertMCPParameters(mcpParams: Record<string, any>): ToolParameter[] {
  return Object.entries(mcpParams).map(([name, def]) => ({
    name,
    type: mapMCPType(def.type),
    description: def.description || name,
    required: def.required || false,
    enum: def.enum,
    default: def.default
  }));
}

/**
 * Map MCP type to agent type
 */
function mapMCPType(mcpType: string): 'string' | 'number' | 'boolean' | 'object' | 'array' {
  switch (mcpType?.toLowerCase()) {
    case 'string':
    case 'text':
      return 'string';
    case 'number':
    case 'integer':
    case 'float':
      return 'number';
    case 'boolean':
      return 'boolean';
    case 'object':
      return 'object';
    case 'array':
      return 'array';
    default:
      return 'string';
  }
}
```

### 4. Edge Function with MCP Integration

```typescript
// File: edge/mcpEnabledEdgeFunction.ts

import { 
  EdgeFunctionRequest, 
  EdgeFunctionResponse, 
  ErrorResponse 
} from '../types/edge.ts';
import { AgentConfig } from '../types/agent.ts';
import { MCPConfig } from '../types/mcp.ts';
import { MCPEnabledAgent } from '../agent/mcpEnabledAgent.ts';
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

// Default MCP configuration
const DEFAULT_MCP_CONFIG: MCPConfig = {
  serverUrl: 'http://localhost:3001',
  authToken: 'local_dev_token',
  features: ['code_search', 'project_indexing']
};

/**
 * Main edge function handler with MCP integration
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
    
    // Get MCP configuration from environment or defaults
    const mcpConfig: MCPConfig = {
      serverUrl: Deno.env.get('MCP_SERVER_URL') || DEFAULT_MCP_CONFIG.serverUrl,
      authToken: Deno.env.get('MCP_AUTH_TOKEN') || DEFAULT_MCP_CONFIG.authToken,
      features: DEFAULT_MCP_CONFIG.features
    };
    
    // Merge configuration
    const config: AgentConfig & { mcp: MCPConfig } = {
      ...DEFAULT_CONFIG,
      ...requestData.config,
      apiKey,
      mcp: mcpConfig
    };
    
    // Initialize agent
    const agent = new MCPEnabledAgent();
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
        version: '1.0.0',
        mcpAvailable: agent.isMCPAvailable()
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
      version: '1.0.0',
      mcpAvailable: false
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

## MCP Tool Implementations

### 1. Code Search Tool

```typescript
// File: mcp/tools/codeSearchTool.ts

/**
 * Implementation of code search tool for MCP
 */
export async function codeSearchTool(params: {
  query: string;
  fileTypes?: string[];
  maxResults?: number;
}): Promise<any> {
  // Validate parameters
  if (!params.query) {
    return {
      error: 'Query parameter is required'
    };
  }
  
  const fileTypes = params.fileTypes || ['.ts', '.js', '.tsx', '.jsx', '.md'];
  const maxResults = params.maxResults || 10;
  
  try {
    // This would be implemented to search code in the repository
    // For now, return mock results
    return {
      result: {
        matches: [
          {
            file: 'src/agent/geminiAgent.ts',
            line: 42,
            content: 'function processUserInput(input: string): void {',
            relevance: 0.95
          },
          {
            file: 'src/types/agent.ts',
            line: 15,
            content: 'export interface UserInput {',
            relevance: 0.85
          }
        ],
        totalMatches: 2,
        query: params.query
      }
    };
  } catch (error) {
    return {
      error: `Code search failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
```

### 2. Project Indexing Tool

```typescript
// File: mcp/tools/projectIndexingTool.ts

/**
 * Implementation of project indexing tool for MCP
 */
export async function projectIndexingTool(params: {
  action: 'index' | 'status' | 'query';
  path?: string;
  query?: string;
}): Promise<any> {
  // Validate parameters
  if (!params.action) {
    return {
      error: 'Action parameter is required'
    };
  }
  
  try {
    switch (params.action) {
      case 'index':
        // This would be implemented to index the project
        return {
          result: {
            status: 'indexed',
            filesIndexed: 120,
            timeMs: 1500
          }
        };
        
      case 'status':
        // This would be implemented to check indexing status
        return {
          result: {
            status: 'ready',
            lastIndexed: new Date().toISOString(),
            fileCount: 120
          }
        };
        
      case 'query':
        // This would be implemented to query the index
        if (!params.query) {
          return {
            error: 'Query parameter is required for query action'
          };
        }
        
        return {
          result: {
            matches: [
              {
                file: 'src/agent/geminiAgent.ts',
                relevance: 0.95
              },
              {
                file: 'src/types/agent.ts',
                relevance: 0.85
              }
            ],
            query: params.query
          }
        };
        
      default:
        return {
          error: `Unknown action: ${params.action}`
        };
    }
  } catch (error) {
    return {
      error: `Project indexing failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
```

## MCP Resources

### 1. Project Context Resource

```typescript
// File: mcp/resources/projectContextResource.ts

/**
 * Implementation of project context resource for MCP
 */
export async function getProjectContext(): Promise<any> {
  try {
    // This would be implemented to fetch project context from a database or file
    return {
      result: {
        name: 'Gemini Agent',
        description: 'A Gemini-powered agent system with edge function integration',
        language: 'TypeScript',
        framework: 'Deno',
        repository: 'https://github.com/example/gemini-agent',
        dependencies: [
          { name: 'deno', version: '>=1.30.0' }
        ],
        structure: {
          src: 'Source code',
          tests: 'Test files',
          docs: 'Documentation'
        }
      }
    };
  } catch (error) {
    return {
      error: `Failed to get project context: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
```

### 2. File Content Resource

```typescript
// File: mcp/resources/fileContentResource.ts

/**
 * Implementation of file content resource for MCP
 */
export async function getFileContent(params: { path: string }): Promise<any> {
  // Validate parameters
  if (!params.path) {
    return {
      error: 'Path parameter is required'
    };
  }
  
  try {
    // This would be implemented to read file content
    // For now, return mock content
    return {
      result: {
        path: params.path,
        content: '// This is mock file content\nconsole.log("Hello, world!");',
        language: params.path.endsWith('.ts') ? 'typescript' : 'plaintext',
        lastModified: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      error: `Failed to get file content: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
```

## MCP Integration Tests

```typescript
// File: tests/mcp/mcpClient.test.ts

import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts';
import { MCPClient } from '../../agent/mcpClient.ts';
import { MCPConfig } from '../../types/mcp.ts';

// Mock fetch for testing
const originalFetch = globalThis.fetch;

// Helper to restore fetch after tests
function restoreFetch() {
  globalThis.fetch = originalFetch;
}

Deno.test('MCPClient - initialization', () => {
  const config: MCPConfig = {
    serverUrl: 'http://localhost:3001',
    authToken: 'test-token',
    features: ['code_search']
  };
  
  const client = new MCPClient(config);
  assertExists(client);
});

Deno.test('MCPClient - invokeTool success', async () => {
  // Mock fetch to return success
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      result: 'Tool executed successfully',
      metadata: { executionTime: 100 }
    }), { status: 200 });
  };
  
  const config: MCPConfig = {
    serverUrl: 'http://localhost:3001',
    authToken: 'test-token',
    features: []
  };
  
  const client = new MCPClient(config);
  const response = await client.invokeTool({
    serverName: 'test-server',
    toolName: 'test-tool',
    arguments: { param: 'value' }
  });
  
  assertEquals(response.result, 'Tool executed successfully');
  assertEquals(response.metadata?.executionTime, 100);
  
  // Restore fetch
  restoreFetch();
});

Deno.test('MCPClient - invokeTool error', async () => {
  // Mock fetch to return error
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      error: 'Tool execution failed'
    }), { status: 400 });
  };
  
  const config: MCPConfig = {
    serverUrl: 'http://localhost:3001',
    authToken: 'test-token',
    features: []
  };
  
  const client = new MCPClient(config);
  const response = await client.invokeTool({
    serverName: 'test-server',
    toolName: 'test-tool',
    arguments: { param: 'value' }
  });
  
  assertEquals(response.error, 'MCP tool invocation error: Tool execution failed');
  
  // Restore fetch
  restoreFetch();
});

Deno.test('MCPClient - accessResource success', async () => {
  // Mock fetch to return success
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      result: { data: 'Resource data' },
      metadata: { size: 100 }
    }), { status: 200 });
  };
  
  const config: MCPConfig = {
    serverUrl: 'http://localhost:3001',
    authToken: 'test-token',
    features: []
  };
  
  const client = new MCPClient(config);
  const response = await client.accessResource({
    serverName: 'test-server',
    uri: 'resource://test'
  });
  
  assertEquals(response.result.data, 'Resource data');
  assertEquals(response.metadata?.size, 100);
  
  // Restore fetch
  restoreFetch();
});

Deno.test('MCPClient - checkAvailability', async () => {
  // Mock fetch to return success
  globalThis.fetch = async () => {
    return new Response('', { status: 200 });
  };
  
  const config: MCPConfig = {
    serverUrl: 'http://localhost:3001',
    authToken: 'test-token',
    features: []
  };
  
  const client = new MCPClient(config);
  const available = await client.checkAvailability();
  
  assertEquals(available, true);
  
  // Mock fetch to return error
  globalThis.fetch = async () => {
    throw new Error('Connection failed');
  };
  
  const notAvailable = await client.checkAvailability();
  assertEquals(notAvailable, false);
  
  // Restore fetch
  restoreFetch();
});
```

## Implementation Phases

### Phase 1: Core MCP Client

1. Implement the MCPClient class
2. Create basic tool invocation and resource access
3. Add health check and tool discovery
4. Write unit tests for the client

### Phase 2: MCP-Enabled Agent

1. Extend GeminiAgent with MCP capabilities
2. Implement tool execution override
3. Add resource access methods
4. Create tool definition converters
5. Write unit tests for the agent

### Phase 3: Edge Function Integration

1. Implement MCP-enabled edge function
2. Add MCP configuration handling
3. Create error handling for MCP operations
4. Write integration tests

### Phase 4: MCP Tools and Resources

1. Implement code search tool
2. Create project indexing tool
3. Add project context resource
4. Implement file content resource
5. Write unit tests for tools and resources

### Phase 5: End-to-End Testing

1. Create end-to-end tests for the complete system
2. Test with real MCP server
3. Measure performance and optimize
4. Document the integration

## Conclusion

This MCP integration plan provides a comprehensive approach to connecting the Gemini agent with external tools and resources through the Model Control Panel infrastructure. By following this plan, we can create a robust and flexible agent system that leverages the power of MCP for enhanced capabilities.