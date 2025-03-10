/**
 * MCP Server Implementation
 * 
 * This file implements the core functionality of the MCP server.
 * It handles authentication and request processing.
 */

/**
 * McpServer class
 * 
 * This class implements the MCP server functionality.
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
   * Handle an HTTP request
   * @param req The HTTP request
   * @returns The HTTP response
   */
  async handleRequest(req: Request): Promise<Response> {
    // Check for authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }
    
    // Verify the token
    const token = authHeader.substring(7);
    if (token !== this.secretKey) {
      return new Response("Invalid token", { status: 403 });
    }

    // Parse the request URL
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop() || "";

    // Handle different request types
    if (req.method === "GET") {
      return this.handleGetRequest(path, url);
    } else if (req.method === "POST") {
      return this.handlePostRequest(path, req);
    } else {
      return new Response("Method not allowed", { status: 405 });
    }
  }

  /**
   * Handle a GET request
   * @param path The request path
   * @param url The request URL
   * @returns The HTTP response
   */
  private async handleGetRequest(path: string, url: URL): Promise<Response> {
    // Handle different GET endpoints
    if (path === "status") {
      return this.getStatus();
    } else if (path === "capabilities") {
      return this.getCapabilities();
    } else {
      return new Response("Not found", { status: 404 });
    }
  }

  /**
   * Handle a POST request
   * @param path The request path
   * @param req The HTTP request
   * @returns The HTTP response
   */
  private async handlePostRequest(path: string, req: Request): Promise<Response> {
    try {
      // Parse the request body
      const body = await req.json();

      // Handle different POST endpoints
      if (path === "execute") {
        return this.executeCommand(body);
      } else if (path === "query") {
        return this.executeQuery(body);
      } else {
        return new Response("Not found", { status: 404 });
      }
    } catch (error: any) {
      return new Response(`Error processing request: ${error.message}`, { status: 400 });
    }
  }

  /**
   * Get the server status
   * @returns The HTTP response
   */
  private getStatus(): Response {
    const status = {
      status: "ok",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(status), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get the server capabilities
   * @returns The HTTP response
   */
  private getCapabilities(): Response {
    const capabilities = {
      version: "1.0.0",
      capabilities: {
        commands: ["echo", "ping"],
        queries: ["time", "random"],
      },
    };

    return new Response(JSON.stringify(capabilities), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Execute a command
   * @param body The request body
   * @returns The HTTP response
   */
  private executeCommand(body: any): Response {
    // Check if the command is valid
    if (!body.command || typeof body.command !== "string") {
      return new Response("Invalid command", { status: 400 });
    }

    // Handle different commands
    if (body.command === "echo") {
      return this.executeEchoCommand(body);
    } else if (body.command === "ping") {
      return this.executePingCommand();
    } else {
      return new Response("Unknown command", { status: 400 });
    }
  }

  /**
   * Execute a query
   * @param body The request body
   * @returns The HTTP response
   */
  private executeQuery(body: any): Response {
    // Check if the query is valid
    if (!body.query || typeof body.query !== "string") {
      return new Response("Invalid query", { status: 400 });
    }

    // Handle different queries
    if (body.query === "time") {
      return this.executeTimeQuery();
    } else if (body.query === "random") {
      return this.executeRandomQuery();
    } else {
      return new Response("Unknown query", { status: 400 });
    }
  }

  /**
   * Execute the echo command
   * @param body The request body
   * @returns The HTTP response
   */
  private executeEchoCommand(body: any): Response {
    // Check if the message is valid
    if (!body.message) {
      return new Response("Missing message", { status: 400 });
    }

    // Echo the message
    const result = {
      result: body.message,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Execute the ping command
   * @returns The HTTP response
   */
  private executePingCommand(): Response {
    const result = {
      result: "pong",
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Execute the time query
   * @returns The HTTP response
   */
  private executeTimeQuery(): Response {
    const result = {
      result: new Date().toISOString(),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Execute the random query
   * @returns The HTTP response
   */
  private executeRandomQuery(): Response {
    const result = {
      result: Math.random(),
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}