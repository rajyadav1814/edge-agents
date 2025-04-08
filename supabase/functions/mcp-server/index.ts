/**
 * MCP Server Edge Function Entry Point
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { McpServer } from "./core/server.ts";

// Get environment variables
const MCP_SECRET_KEY = Deno.env.get("MCP_SECRET_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ACCESS_TOKEN = Deno.env.get("SUPABASE_ACCESS_TOKEN") || "";

if (!MCP_SECRET_KEY) {
  throw new Error("MCP_SECRET_KEY environment variable is required");
}

// Initialize MCP Server
const mcpServer = new McpServer(MCP_SECRET_KEY);

// Main request handler
serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Discovery endpoint for OAuth 2.0 Authorization Server Metadata
  if (path === "/.well-known/oauth-authorization-server") {
    const issuer = SUPABASE_URL || "https://example.com";
    const metadata = {
      issuer,
      authorization_endpoint: issuer + "/authorize",
      token_endpoint: issuer + "/token",
      registration_endpoint: issuer + "/register"
    };
    return new Response(JSON.stringify(metadata), {status: 200, headers: {"Content-Type": "application/json"}});
  }
 
  // Handle MCP Server requests
  if (path.startsWith("/mcp")) {
    return await mcpServer.handleRequest(req);
  }

  // Default response for unmatched routes
  return new Response(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: "Method not found",
        data: {
          availableEndpoints: ["/mcp"]
        }
      }
    }), 
    {
      status: 404,
      headers: { "Content-Type": "application/json" }
    }
  );
});
