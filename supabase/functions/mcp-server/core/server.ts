/**
 * MCP Server Implementation
 * 
 * This file implements the core functionality of the MCP server following JSON-RPC 2.0 specification.
 */

import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcSuccessResponse,
  JsonRpcErrorResponse,
  ToolUseRequest,
  ToolUseResponse,
  ResourceAccessRequest,
  ResourceAccessResponse,
  PromptUseRequest,
  PromptUseResponse,
  ErrorCode
} from './types.ts';

/**
 * McpServer class
 * 
 * This class implements the MCP server functionality with JSON-RPC 2.0 support.
 */
export class McpServer {
  private secretKey: string;

  /**
   * Constructor
   * @param secretKey The secret key for authentication
   */
  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  /**
   * Create a JSON-RPC 2.0 success response
   */
  private createSuccessResponse(id: string, result: any): JsonRpcSuccessResponse {
    return {
      jsonrpc: "2.0",
      id,
      result
    };
  }

  /**
   * Create a JSON-RPC 2.0 error response
   */
  private createErrorResponse(id: string | null, code: ErrorCode, message: string, data?: any): JsonRpcErrorResponse {
    return {
      jsonrpc: "2.0",
      id,
      error: {
        code,
        message,
        data
      }
    };
  }

  /**
   * Handle an HTTP request
   * @param req The HTTP request
   * @returns The HTTP response
   */
  async handleRequest(req: Request): Promise<Response> {
    // Check for Authorization header
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      if (!authHeader.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify(this.createErrorResponse(null, ErrorCode.InvalidRequest, "Authorization header must use Bearer token format")),
          {
            status: 401,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
      
      const token = authHeader.slice(7).trim();
      if (token !== this.secretKey) {
        return new Response(
          JSON.stringify(this.createErrorResponse(null, ErrorCode.InvalidRequest, "Invalid authorization token")),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }
    }
    
    // Check for Server-Sent Events request
    const accept = req.headers.get("Accept");
    if (accept === "text/event-stream") {
      return this.handleSSE(req);
    }

    try {
      // Parse request as JSON-RPC
      const rpcRequest = await req.json() as JsonRpcRequest;
      
      if (!rpcRequest.jsonrpc || rpcRequest.jsonrpc !== "2.0") {
        return new Response(
          JSON.stringify(this.createErrorResponse(null, ErrorCode.InvalidRequest, "Invalid JSON-RPC version")),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json"
          }
        });
      }

      const { id, method, params } = rpcRequest;

      // Handle different methods
      switch (method) {
        case "discovery":
          return this.handleDiscovery(id);
        case "tool_use":
          return this.handleToolUse(id, params as ToolUseRequest);
        case "resource_access": 
          return this.handleResourceAccess(id, params as ResourceAccessRequest);
        case "prompt_use":
          return this.handlePromptUse(id, params as PromptUseRequest);
        default:
          return new Response(
            JSON.stringify(this.createErrorResponse(id, ErrorCode.MethodNotFound, "Method not found")),
            { 
              status: 404,
              headers: {
                "Content-Type": "application/json"
              }
            }
          );
      }
    } catch (error: any) {
      return new Response(
        JSON.stringify(this.createErrorResponse(null, ErrorCode.ParseError, "Invalid JSON: " + error.message)),
        { 
          status: 400,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  }

  /**
   * Handle discovery request
   */
  private handleDiscovery(id: string): Response {
    const result = {
      version: "1.0.0",
      protocol: "JSON-RPC 2.0",
      transport: ["http", "sse"],
      methods: {
        discovery: {
          description: "Get server capabilities and available methods"
        },
        tool_use: {
          description: "Execute a tool command",
          params: {
            command: "string"
          }
        },
        resource_access: {
          description: "Access a resource",
          params: {
            resourceId: "string"
          }
        },
        prompt_use: {
          description: "Process a prompt",
          params: {
            prompt: "string"
          }
        }
      }
    };

    return new Response(
      JSON.stringify(this.createSuccessResponse(id, result)),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }

  /**
   * Handle Server-Sent Events
   */
  private async handleSSE(req: Request): Promise<Response> {
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();
    
    // Send initial connection established event
    const encoder = new TextEncoder();
    await writer.write(encoder.encode("event: connected\ndata: {}\n\n"));
    
    // Keep connection alive with periodic heartbeats
    const heartbeat = setInterval(async () => {
      await writer.write(encoder.encode("event: heartbeat\ndata: {}\n\n"));
    }, 30000);

    // Clean up on close
    req.signal.addEventListener("abort", () => {
      clearInterval(heartbeat);
      writer.close();
    });

    return new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  }

  /**
   * Handle tool use requests
   */
  private async handleToolUse(id: string, params: ToolUseRequest): Promise<Response> {
    try {
      // Validate params
      if (!params.command) {
        return new Response(
          JSON.stringify(this.createErrorResponse(id, ErrorCode.InvalidParams, "Missing command parameter")),
          { 
            status: 400,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      // Execute tool
      const result: ToolUseResponse = {
        type: "tool_use",
        command: params.command,
        result: {
          output: `Executed command: ${params.command}`
        }
      };

      return new Response(
        JSON.stringify(this.createSuccessResponse(id, result)),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify(this.createErrorResponse(id, ErrorCode.InternalError, error.message)),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  }

  /**
   * Handle resource access requests
   */
  private async handleResourceAccess(id: string, params: ResourceAccessRequest): Promise<Response> {
    try {
      // Validate params
      if (!params.resourceId) {
        return new Response(
          JSON.stringify(this.createErrorResponse(id, ErrorCode.InvalidParams, "Missing resourceId parameter")),
          { 
            status: 400,
            headers: {
              "Content-Type": "application/json"
            }
          }
        );
      }

      // Access resource
      const result: ResourceAccessResponse = {
        type: "resource_access",
        resourceId: params.resourceId,
        contentType: "application/json",
        data: {
          key1: "value1",
          key2: "value2"
        }
      };

      return new Response(
        JSON.stringify(this.createSuccessResponse(id, result)),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify(this.createErrorResponse(id, ErrorCode.InternalError, error.message)),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  }

  /**
   * Handle prompt use requests
   */
  private async handlePromptUse(id: string, params: PromptUseRequest): Promise<Response> {
    try {
      const result: PromptUseResponse = {
        type: "prompt_use",
        messages: [
          { 
            role: "system", 
            content: "You are an assistant." 
          },
          { 
            role: "user", 
            content: params.prompt || "Default prompt" 
          }
        ]
      };

      return new Response(
        JSON.stringify(this.createSuccessResponse(id, result)),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    } catch (error: any) {
      return new Response(
        JSON.stringify(this.createErrorResponse(id, ErrorCode.InternalError, error.message)),
        { 
          status: 500,
          headers: {
            "Content-Type": "application/json"
          }
        }
      );
    }
  }
}