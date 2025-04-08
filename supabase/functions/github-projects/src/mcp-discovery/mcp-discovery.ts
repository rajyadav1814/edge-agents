import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

/**
 * Handles MCP discovery requests
 * @returns Response object with MCP discovery information
 */
function handleMcpDiscovery(): Response {
  console.log("MCP Discovery handler called - DEDICATED ENDPOINT");
  
  // Hard-coded MCP discovery response
  const discoveryData = {
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
  
  console.log("MCP Discovery response:", JSON.stringify(discoveryData, null, 2));
  
  // Return the discovery data as JSON with explicit headers
  return new Response(
    JSON.stringify(discoveryData),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    }
  );
}

/**
 * Main request handler for the MCP discovery edge function
 * @param req Request object
 * @returns Response object
 */
async function handleRequest(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log("MCP Discovery endpoint called");
    return handleMcpDiscovery();
  } catch (error: any) {
    console.error("Error in MCP discovery endpoint:", error);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", message: error.message || "Unknown error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Start the server
serve(handleRequest, { port: 8002 });