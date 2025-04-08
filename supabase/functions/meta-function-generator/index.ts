import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { MCPServer } from "./mcp_server.ts";

// Configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SB_ACCESS_KEY = Deno.env.get("SB_ACCESS_KEY") || "";

// Initialize MCP Server
const mcpServer = new MCPServer({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_SERVICE_ROLE_KEY,
  accessToken: SB_ACCESS_KEY,
});

// Main request handler
serve(async (req: Request) => {
  const url = new URL(req.url);
  const path = url.pathname;

  // Handle MCP Server requests
  if (path.startsWith("/mcp")) {
    return await mcpServer.handleRequest(req);
  }

  // Handle function management requests
  if (path.startsWith("/functions")) {
    const functionPath = path.replace("/functions", "");
    
    // Create and deploy function
    if (req.method === "POST" && functionPath === "/deploy") {
      return await mcpServer.handleDeployFunction(req);
    }
    
    // Delete function
    if (req.method === "DELETE" && functionPath.startsWith("/delete/")) {
      const functionName = functionPath.replace("/delete/", "");
      return await mcpServer.handleDeleteFunction(functionName);
    }
    
    // List functions
    if (req.method === "GET" && functionPath === "/list") {
      return await mcpServer.handleListFunctions();
    }
    
    // Test function
    if (req.method === "POST" && functionPath === "/test") {
      return await mcpServer.handleTestFunction(req);
    }
  }

  // Default response for unmatched routes
  return new Response(JSON.stringify({
    error: "Not found",
    endpoints: ["/mcp", "/functions/deploy", "/functions/delete/{name}", "/functions/list", "/functions/test"]
  }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
});