/**
 * Core MCP types for the Gemini Tumbler service
 */

export interface McpTool<TArgs = unknown, TResult = unknown> {
  name: string;
  description: string;
  execute(args: TArgs): Promise<TResult>;
}

export interface McpResource<TResult = unknown> {
  uri: string;
  description: string;
  access(method?: string, body?: unknown): Promise<TResult>;
}

export interface McpDiscoveryInfo {
  serverName: string;
  version: string;
  capabilities: string[];
  tools: {
    name: string;
    description: string;
  }[];
  resources: {
    uri: string;
    description: string;
  }[];
}

export interface McpClientConfig {
  serverUrl: string;
  authToken: string;
  discoveryEndpoint?: string;
}

export interface McpToolRegistry {
  registerTool<TArgs = unknown, TResult = unknown>(tool: McpTool<TArgs, TResult>): void;
  getTool(name: string): McpTool | undefined;
  listTools(): McpTool[];
}

export interface McpResourceRegistry {
  registerResource<T = unknown>(resource: McpResource<T>): void;
  getResource(uri: string): McpResource | undefined;
  listResources(): McpResource[];
}