/**
 * Edge Function module for SPARC 2.0
 * Provides a serverless deployment option for the autonomous diff-based coding bot
 */

import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { loadConfig } from "../config.ts";
import { SPARC2Agent, AgentOptions, FileToProcess } from "../agent/agent.ts";
import { logMessage } from "../logger.ts";

/**
 * Handle edge function request
 * @param req The request object
 * @returns Response object
 */
export async function handleEdgeRequest(req: Request): Promise<Response> {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Parse the URL to determine the request type
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop() || "";
    
    // Load config
    const configPath = "./config.toml";
    const tomlConfig = await loadConfig(configPath);
    
    // Create agent options
    const agentOptions: AgentOptions = {
      model: tomlConfig.models.reasoning,
      mode: tomlConfig.execution.mode,
      diffMode: tomlConfig.execution.diff_mode,
      processing: tomlConfig.execution.processing,
    };
    
    // Create and initialize agent
    const agent = new SPARC2Agent(agentOptions);
    await agent.init();
    
    // Handle different paths
    switch (path) {
      case "rollback": {
        const { target, mode } = await req.json();
        
        if (!target) {
          return new Response(
            JSON.stringify({ error: "Target is required for rollback" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const rollbackMode = mode || (target.startsWith("cp") ? "checkpoint" : "temporal");
        await agent.rollback(target, rollbackMode as "checkpoint" | "temporal");
        
        return new Response(
          JSON.stringify({ message: `Rollback to ${target} completed` }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      case "checkpoint": {
        const { name } = await req.json();
        
        if (!name) {
          return new Response(
            JSON.stringify({ error: "Name is required for checkpoint" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const hash = await agent.createCheckpoint(name);
        
        return new Response(
          JSON.stringify({ message: `Checkpoint ${name} created`, hash }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      case "execute": {
        const { code, language } = await req.json();
        
        if (!code) {
          return new Response(
            JSON.stringify({ error: "Code is required for execution" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        const result = await agent.executeCode(code, { language });
        
        return new Response(
          JSON.stringify({ result }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      case "plan": {
        const { description, files } = await req.json();
        
        if (!description) {
          return new Response(
            JSON.stringify({ error: "Description is required for planning" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        if (!files || !Array.isArray(files) || files.length === 0) {
          return new Response(
            JSON.stringify({ error: "Files array is required for planning" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        // Validate files format
        const processedFiles: FileToProcess[] = [];
        for (const file of files) {
          if (!file.path || !file.content) {
            return new Response(
              JSON.stringify({ error: "Each file must have path and content properties" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          
          processedFiles.push({
            path: file.path,
            content: file.content
          });
        }
        
        const results = await agent.planAndExecute(description, processedFiles);
        
        return new Response(
          JSON.stringify({ results }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      case "status": {
        // Return the status of the agent
        const isRepoClean = await agent.isRepoClean();
        
        return new Response(
          JSON.stringify({
            status: "ok",
            agent: {
              model: agentOptions.model,
              mode: agentOptions.mode,
              diffMode: agentOptions.diffMode,
              processing: agentOptions.processing
            },
            repository: {
              clean: isRepoClean
            }
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown path: ${path}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logMessage("error", "Edge function error", { error: errorMessage });
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

// For local testing as an edge function
if (import.meta.main) {
  // Create a simple HTTP server
  console.log("SPARC 2.0 Edge Function running on http://localhost:8000");
  
  // Start the server
  serve(handleEdgeRequest, { port: 8000 });
}