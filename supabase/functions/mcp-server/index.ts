// file: function-generator/index.ts
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";
import { MCPServer } from "./mcp_server.ts";

// Configuration
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SUPABASE_ACCESS_TOKEN = Deno.env.get("SUPABASE_ACCESS_TOKEN") || "";

// Initialize MCP Server
const mcpServer = new MCPServer({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_SERVICE_ROLE_KEY,
  accessToken: SUPABASE_ACCESS_TOKEN,
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
      return await handleDeployFunction(req);
    }
    
    // Delete function
    if (req.method === "DELETE" && functionPath.startsWith("/delete/")) {
      const functionName = functionPath.replace("/delete/", "");
      return await handleDeleteFunction(functionName);
    }
    
    // Test function
    if (req.method === "POST" && functionPath === "/test") {
      return await handleTestFunction(req);
    }
  }

  // Default response for unmatched routes
  return new Response(JSON.stringify({
    error: "Not found",
    endpoints: ["/mcp", "/functions/deploy", "/functions/delete/{name}", "/functions/test"]
  }), {
    status: 404,
    headers: { "Content-Type": "application/json" }
  });
});

// Function handlers
async function handleDeployFunction(req: Request): Promise<Response> {
  try {
    const contentType = req.headers.get("Content-Type") || "";
    let functionCode: string = "";
    let functionName: string = "";
    let functionConfig: Record<string, any> = {};
    
    if (contentType.includes("multipart/form-data")) {
      // Handle bundled file upload
      const formData = await req.formData();
      const file = formData.get("file") as File;
      functionCode = await file.text();
      functionName = formData.get("name") as string;
      functionConfig = JSON.parse(formData.get("config") as string || "{}");
    } else {
      // Handle direct code submission
      const json = await req.json();
      functionCode = json.code;
      functionName = json.name;
      functionConfig = json.config || {};
    }
    
    // Validate inputs
    if (!functionName || !functionCode) {
      return new Response(JSON.stringify({ error: "Missing function name or code" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // Test the function
    const testResult = await testFunction(functionCode);
    if (!testResult.success) {
      // Attempt to fix if tests failed
      const fixResult = await attemptFix(functionCode, testResult.errors);
      if (!fixResult.success) {
        return new Response(JSON.stringify({ 
          error: "Function tests failed and couldn't be fixed",
          testResult,
          fixResult
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      functionCode = fixResult.code;
    }
    
    // Deploy to Supabase
    const deployResult = await deployFunction(functionName, functionCode, functionConfig);
    
    return new Response(JSON.stringify({
      success: true,
      message: `Function ${functionName} deployed successfully`,
      deployResult
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function handleDeleteFunction(functionName: string): Promise<Response> {
  try {
    const result = await deleteFunction(functionName);
    return new Response(JSON.stringify({
      success: true,
      message: `Function ${functionName} deleted successfully`,
      result
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function handleTestFunction(req: Request): Promise<Response> {
  try {
    const { code } = await req.json();
    const result = await testFunction(code);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

// Core functionality
async function testFunction(code: string): Promise<Record<string, any>> {
  // Basic validation
  try {
    // Parse the code to check for syntax errors
    new Function(code);
    
    // Check for common issues
    const issues = [];
    if (!code.includes("serve(")) {
      issues.push("Missing Deno.serve or serve function");
    }
    
    // More sophisticated tests could be added here
    
    return {
      success: issues.length === 0,
      errors: issues
    };
  } catch (error) {
    return {
      success: false,
      errors: [error.message]
    };
  }
}

async function attemptFix(code: string, errors: string[]): Promise<Record<string, any>> {
  // Simple fixes for common issues
  let fixedCode = code;
  
  // Add serve function if missing
  if (errors.includes("Missing Deno.serve or serve function")) {
    if (!code.includes("import { serve }")) {
      fixedCode = `import { serve } from "https://deno.land/std@0.140.0/http/server.ts";\n${fixedCode}`;
    }
    
    if (!code.match(/serve\s*\(/)) {
      fixedCode = `${fixedCode}\n\nserve((req) => {\n  return new Response("Hello World");\n});`;
    }
  }
  
  // Re-test the fixed code
  const testResult = await testFunction(fixedCode);
  
  return {
    success: testResult.success,
    code: fixedCode,
    originalErrors: errors,
    remainingErrors: testResult.errors
  };
}

async function deployFunction(name: string, code: string, config: Record<string, any> = {}): Promise<Record<string, any>> {
  // Create FormData for the API request
  const formData = new FormData();
  
  // Prepare metadata
  const metadata = {
    name,
    entrypoint_path: "index.ts",
    ...config
  };
  
  formData.append("metadata", JSON.stringify(metadata));
  
  // Add the function code as a file
  const file = new File([code], "index.ts", { type: "text/typescript" });
  formData.append("file", file);
  
  // Make request to Supabase API
  const projectRef = SUPABASE_URL.split(".")[0].replace("https://", "");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/functions/deploy?slug=${name}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`
      },
      body: formData
    }
  );
  
  return await response.json();
}

async function deleteFunction(name: string): Promise<Record<string, any>> {
  // Make request to Supabase API
  const projectRef = SUPABASE_URL.split(".")[0].replace("https://", "");
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/functions/${name}`,
    {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${SUPABASE_ACCESS_TOKEN}`
      }
    }
  );
  
  return await response.json();
}
// MCP Server Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { McpServer } from "./core/server.ts";

// Get the MCP_SECRET_KEY from environment variables
const MCP_SECRET_KEY = Deno.env.get("MCP_SECRET_KEY");
if (!MCP_SECRET_KEY) {
  throw new Error("MCP_SECRET_KEY environment variable is required");
}

// Create a new MCP server instance
const server = new McpServer(MCP_SECRET_KEY);

// Serve the MCP server
serve(async (req) => {
  return await server.handleRequest(req);
});
