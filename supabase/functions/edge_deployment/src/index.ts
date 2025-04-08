import { serve } from "std/http/server.ts";
import { config } from "./config.ts";
import * as commands from "./commands.ts";
import { EdgeFunction } from "./api-client.ts";

// Define the request handler
async function handleRequest(req: Request): Promise<Response> {
  // Set CORS headers
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  });

  // Handle OPTIONS request for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  try {
    // Parse the URL to get the path
    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);
    
    // Get the command from the path
    const command = path[0] || "help";
    
    // Handle different commands
    let result;
    
    if (command === "list") {
      // List all functions
      result = await commands.listFunctions();
      
      // Format the output for better readability
      if (result.success && result.data) {
        const functions = result.data as EdgeFunction[];
        result.data = {
          count: functions.length,
          functions: functions.map(func => ({
            slug: func.slug,
            name: func.name,
            status: func.status,
            version: func.version,
            verify_jwt: func.verify_jwt,
            created_at: new Date(func.created_at).toISOString(),
            updated_at: new Date(func.updated_at).toISOString(),
          })),
        };
      }
    } else if (command === "get") {
      // Get function details
      const slug = path[1];
      if (!slug) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Function slug is required",
          }),
          { status: 400, headers }
        );
      }
      
      result = await commands.getFunctionDetails(slug);
    } else if (command === "body") {
      // Get function body
      const slug = path[1];
      if (!slug) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Function slug is required",
          }),
          { status: 400, headers }
        );
      }
      
      result = await commands.getFunctionBody(slug);
    } else if (command === "create" || command === "update") {
      // Create or update a function
      // This requires a POST request with a JSON body
      if (req.method !== "POST") {
        return new Response(
          JSON.stringify({
            success: false,
            message: `${command} requires a POST request`,
          }),
          { status: 405, headers }
        );
      }
      
      // Parse the request body
      let body;
      try {
        body = await req.json();
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Invalid JSON body",
          }),
          { status: 400, headers }
        );
      }
      
      // Validate the request body
      if (command === "create") {
        // Create a new function
        const { slug, name, code, verify_jwt } = body;
        
        if (!slug || !name || !code) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "slug, name, and code are required",
            }),
            { status: 400, headers }
          );
        }
        
        result = await commands.createFunction(slug, name, code, !!verify_jwt);
      } else {
        // Update an existing function
        const { slug, name, code, verify_jwt } = body;
        
        if (!slug) {
          return new Response(
            JSON.stringify({
              success: false,
              message: "slug is required",
            }),
            { status: 400, headers }
          );
        }
        
        const updates: Record<string, any> = {};
        if (name !== undefined) updates.name = name;
        if (code !== undefined) updates.body = code;
        if (verify_jwt !== undefined) updates.verify_jwt = !!verify_jwt;
        
        result = await commands.updateFunction(slug, updates);
      }
    } else if (command === "delete") {
      // Delete a function
      const slug = path[1];
      if (!slug) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "Function slug is required",
          }),
          { status: 400, headers }
        );
      }
      
      result = await commands.deleteFunction(slug);
    } else if (command === "help") {
      // Show help information
      result = {
        success: true,
        message: "Edge Deployment API",
        data: {
          commands: [
            { path: "/list", description: "List all Edge Functions" },
            { path: "/get/{slug}", description: "Get details of a specific Edge Function" },
            { path: "/body/{slug}", description: "Get the body of a specific Edge Function" },
            { path: "/create", description: "Create a new Edge Function (POST)" },
            { path: "/update", description: "Update an existing Edge Function (POST)" },
            { path: "/delete/{slug}", description: "Delete an Edge Function" },
            { path: "/help", description: "Show this help information" },
          ],
        },
      };
    } else {
      // Unknown command
      return new Response(
        JSON.stringify({
          success: false,
          message: `Unknown command: ${command}`,
          help: "Available commands: list, get, body, create, update, delete, help",
        }),
        { status: 400, headers }
      );
    }
    
    // Return the result
    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 500, headers }
    );
  } catch (error) {
    // Handle any unexpected errors
    console.error("Error handling request:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Internal server error: ${error instanceof Error ? error.message : String(error)}`,
      }),
      { status: 500, headers }
    );
  }
}

// Start the server
serve(handleRequest);

console.log(`Edge Deployment function running.`);
console.log(`Project ID: ${config.projectId}`);
console.log(`API Base URL: ${config.apiBaseUrl}`);
