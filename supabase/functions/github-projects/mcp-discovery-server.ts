import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const PORT = 8002;

// MCP Discovery response
const mcpDiscoveryResponse = {
  name: "github-projects",
  version: "1.0.0",
  description: "GitHub Projects API with GraphQL and REST support",
  endpoints: {
    graphql: "/github-api/graphql",
    projects: "/github-api/projects",
    repositories: "/github-api/repo"
  },
  capabilities: [
    "github-api-proxy",
    "projects-management",
    "repository-access",
    "mcp-discovery"
  ],
  documentation: "/github-api/docs",
  contact: {
    maintainer: "Agentics Team",
    support: "support@example.com"
  }
};

// CORS headers (without Content-Type)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};

// Handle requests
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  const url = new URL(req.url);
  console.log(`Request path: ${url.pathname}`);

  // MCP Discovery endpoint
  if (url.pathname === "/" || url.pathname === "/mcp-discovery") {
    return new Response(JSON.stringify(mcpDiscoveryResponse, null, 2), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }

  // MCP SSE endpoint for event streaming
  if (url.pathname === "/events") {
    // Create headers specifically for SSE
    const sseHeaders = new Headers({
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    });

    // Log the headers for debugging
    console.log("SSE Headers:", Object.fromEntries(sseHeaders.entries()));

    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        controller.enqueue(`event: connection\ndata: {"status":"connected"}\n\n`);
        
        // Keep connection alive with periodic messages
        const interval = setInterval(() => {
          controller.enqueue(`event: ping\ndata: ${Date.now()}\n\n`);
        }, 30000);
        
        // Clean up on close
        req.signal.addEventListener("abort", () => {
          clearInterval(interval);
          controller.close();
        });
      }
    });

    return new Response(stream, { headers: sseHeaders });
  }

  // Default 404 response
  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}, { port: PORT });

console.log(`MCP Discovery server running on http://localhost:${PORT}/`);
