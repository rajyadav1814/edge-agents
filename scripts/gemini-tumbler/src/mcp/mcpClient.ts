/**
 * MCP Client implementation for the Gemini Tumbler service
 */

import { 
  McpClientConfig, 
  McpDiscoveryInfo, 
  McpTool, 
  McpResource,
  McpToolRegistry,
  McpResourceRegistry 
} from "../types/mcp.ts";

export class McpClient implements McpToolRegistry, McpResourceRegistry {
  private config: McpClientConfig;
  private tools: Map<string, McpTool> = new Map();
  private resources: Map<string, McpResource> = new Map();
  private discoveryInfo?: McpDiscoveryInfo;

  constructor(config: McpClientConfig) {
    this.config = config;
  }

  /**
   * Initialize the MCP client by discovering available tools and resources
   */
  async initialize(): Promise<void> {
    try {
      // Discover server capabilities
      this.discoveryInfo = await this.discover();
      
      // Register built-in tools and resources
      await this.registerBuiltIns();

    } catch (error) {
      console.error("Failed to initialize MCP client:", error);
      throw error;
    }
  }

  /**
   * Discover server capabilities and available tools/resources
   */
  private async discover(): Promise<McpDiscoveryInfo> {
    const endpoint = this.config.discoveryEndpoint || "/discover";
    const response = await fetch(`${this.config.serverUrl}${endpoint}`, {
      headers: {
        "Authorization": `Bearer ${this.config.authToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Discovery failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Register built-in tools and resources based on discovery info
   */
  private async registerBuiltIns(): Promise<void> {
    if (!this.discoveryInfo) {
      throw new Error("Discovery info not available");
    }

    // Register tools from discovery info
    for (const toolInfo of this.discoveryInfo.tools) {
      this.registerTool({
        name: toolInfo.name,
        description: toolInfo.description,
        execute: async (args: unknown) => {
          const response = await fetch(`${this.config.serverUrl}/tools/${toolInfo.name}`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${this.config.authToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify(args)
          });

          if (!response.ok) {
            throw new Error(`Tool execution failed: ${response.statusText}`);
          }

          return response.json();
        }
      });
    }

    // Register resources from discovery info
    for (const resourceInfo of this.discoveryInfo.resources) {
      this.registerResource({
        uri: resourceInfo.uri,
        description: resourceInfo.description,
        access: async (method = "GET", body?: unknown) => {
          const response = await fetch(`${this.config.serverUrl}/resources${resourceInfo.uri}`, {
            method,
            headers: {
              "Authorization": `Bearer ${this.config.authToken}`,
              "Content-Type": "application/json"
            },
            body: body ? JSON.stringify(body) : undefined
          });

          if (!response.ok) {
            throw new Error(`Resource access failed: ${response.statusText}`);
          }

          return response.json();
        }
      });
    }
  }

  // Tool Registry Implementation
  registerTool(tool: McpTool): void {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): McpTool | undefined {
    return this.tools.get(name);
  }

  listTools(): McpTool[] {
    return Array.from(this.tools.values());
  }

  // Resource Registry Implementation
  registerResource(resource: McpResource): void {
    this.resources.set(resource.uri, resource);
  }

  getResource(uri: string): McpResource | undefined {
    return this.resources.get(uri);
  }

  listResources(): McpResource[] {
    return Array.from(this.resources.values());
  }

  /**
   * Get discovery information
   */
  getDiscoveryInfo(): McpDiscoveryInfo | undefined {
    return this.discoveryInfo;
  }
}