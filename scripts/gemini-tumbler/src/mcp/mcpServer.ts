/**
 * MCP Server implementation for the Gemini Tumbler service
 */

import { serve } from "https://deno.land/std/http/server.ts";
import { 
  McpTool, 
  McpResource, 
  McpDiscoveryInfo,
  McpToolRegistry,
  McpResourceRegistry 
} from "../types/mcp.ts";

export interface McpServerConfig {
  port: number;
  authToken: string;
}

export class McpServer implements McpToolRegistry, McpResourceRegistry {
  private config: McpServerConfig;
  private tools: Map<string, McpTool> = new Map();
  private resources: Map<string, McpResource> = new Map();
  private abortController?: AbortController;

  constructor(config: McpServerConfig) {
    this.config = config;
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      console.log(`MCP Server running on port ${this.config.port}`);
      await serve(this.handleRequest.bind(this), { 
        port: this.config.port,
        signal 
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error("Server error:", error);
        throw error;
      }
    }
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    this.abortController?.abort();
  }

  /**
   * Handle an individual HTTP request
   */
  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      // Verify auth token
      const authHeader = request.headers.get("Authorization");
      if (!this.verifyAuth(authHeader)) {
        return new Response("Unauthorized", { status: 401 });
      }

      // Route request
      switch (url.pathname) {
        case "/discover":
          return await this.handleDiscovery();

        case (url.pathname.match(/^\/tools\/.*/)?.input):
          return await this.handleToolExecution(request);

        case (url.pathname.match(/^\/resources\/.*/)?.input):
          return await this.handleResourceAccess(request);

        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch (error: unknown) {
      console.error("Request error:", error instanceof Error ? error.message : String(error));
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  /**
   * Handle discovery request
   */
  private async handleDiscovery(): Promise<Response> {
    const discoveryInfo: McpDiscoveryInfo = {
      serverName: "gemini-tumbler-mcp",
      version: "1.0.0",
      capabilities: ["tool_execution", "resource_access"],
      tools: this.listTools().map(tool => ({
        name: tool.name,
        description: tool.description
      })),
      resources: this.listResources().map(resource => ({
        uri: resource.uri,
        description: resource.description
      }))
    };

    return new Response(JSON.stringify(discoveryInfo), {
      headers: { "Content-Type": "application/json" }
    });
  }

  /**
   * Handle tool execution request
   */
  private async handleToolExecution(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const toolName = url.pathname.split("/")[2];
    const tool = this.getTool(toolName);

    if (!tool) {
      return new Response("Tool Not Found", { status: 404 });
    }

    try {
      const args = await request.json();
      const result = await tool.execute(args);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: unknown) {
      console.error("Tool execution error:", error instanceof Error ? error.message : String(error));
      return new Response("Tool Execution Failed", { status: 500 });
    }
  }

  /**
   * Handle resource access request
   */
  private async handleResourceAccess(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const resourceUri = url.pathname.replace("/resources", "");
    const resource = this.getResource(resourceUri);

    if (!resource) {
      return new Response("Resource Not Found", { status: 404 });
    }

    try {
      const method = request.method;
      const body = request.method !== "GET" ? 
        await request.json() : undefined;
      
      const result = await resource.access(method, body);

      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: unknown) {
      console.error("Resource access error:", error instanceof Error ? error.message : String(error));
      return new Response("Resource Access Failed", { status: 500 });
    }
  }

  /**
   * Verify authentication token
   */
  private verifyAuth(authHeader: string | null): boolean {
    if (!authHeader) return false;
    const [type, token] = authHeader.split(" ");
    return type === "Bearer" && token === this.config.authToken;
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
}