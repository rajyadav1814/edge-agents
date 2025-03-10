// Using standard Deno modules instead of MCP since it's not available
import { Server } from "https://deno.land/std@0.140.0/http/server.ts";

export class MCPServer {
  private supabaseUrl: string;
  private supabaseKey: string;
  private accessToken: string;

  constructor(config: {
    supabaseUrl: string;
    supabaseKey: string;
    accessToken: string;
  }) {
    this.supabaseUrl = config.supabaseUrl;
    this.supabaseKey = config.supabaseKey;
    this.accessToken = config.accessToken;

    console.log("Initializing Function Generator Server...");
    console.log(`Supabase URL available: ${this.supabaseUrl ? "Yes" : "No"}`);
    console.log(`Supabase Key available: ${this.supabaseKey ? "Yes" : "No"}`);
    console.log(`Access Token available: ${this.accessToken ? "Yes" : "No"}`);
  }

  async handleRequest(req: Request): Promise<Response> {
    try {
      console.log(`Function Generator handling request: ${req.url}`);

      // Check for Authorization header
      const authHeader = req.headers.get("Authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        // Override the access token if provided in the request
        const token = authHeader.replace("Bearer ", "");
        this.accessToken = token;
      }
      
      const url = new URL(req.url);
      const path = url.pathname;
      
      // Handle function management requests
      if (path.startsWith("/functions")) {
        const functionPath = path.replace("/functions", "");
        
        // Create and deploy function
        if (req.method === "POST" && functionPath === "/deploy") {
          return await this.handleDeployFunction(req);
        }
        
        // Delete function
        if (req.method === "DELETE" && functionPath.startsWith("/delete/")) {
          const functionName = functionPath.replace("/delete/", "");
          return await this.handleDeleteFunction(functionName);
        }
        
        // List functions
        if (req.method === "GET" && functionPath === "/list") {
          return await this.handleListFunctions();
        }
        
        // Test function
        if (req.method === "POST" && functionPath === "/test") {
          return await this.handleTestFunction(req);
        }
      }
      
      // Default response for unmatched routes
      return new Response(JSON.stringify({
        error: "Not found",
        endpoints: ["/functions/deploy", "/functions/delete/{name}", "/functions/list", "/functions/test"]
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error handling request: ${errorMessage}`);
      return new Response(JSON.stringify({
        error: errorMessage
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  async handleDeployFunction(req: Request): Promise<Response> {
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
        const configStr = formData.get("config") as string;
        functionConfig = configStr ? JSON.parse(configStr) : {};
      } else {
        // Handle direct code submission
        const json = await req.json();
        functionCode = json.code as string;
        functionName = json.name as string;
        functionConfig = json.config as Record<string, any> || {};
      }
      
      // Validate inputs
      if (!functionName || !functionCode) {
        return new Response(JSON.stringify({ error: "Missing function name or code" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Test the function
      const testResult = await this.testFunction(functionCode);
      if (!testResult.success) {
        // Attempt to fix if tests failed
        const fixResult = await this.attemptFix(functionCode, testResult.errors);
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
      const deployResult = await this.deployFunction(functionName, functionCode, functionConfig);
      
      return new Response(JSON.stringify({
        success: true,
        message: `Function ${functionName} deployed successfully`,
        deployResult
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  async handleDeleteFunction(functionName: string): Promise<Response> {
    try {
      const result = await this.deleteFunction(functionName);
      return new Response(JSON.stringify({
        success: true,
        message: `Function ${functionName} deleted successfully`,
        result
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  async handleListFunctions(): Promise<Response> {
    try {
      const result = await this.listFunctions();
      return new Response(JSON.stringify({
        success: true,
        functions: result
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  async handleTestFunction(req: Request): Promise<Response> {
    try {
      const { code } = await req.json();
      const result = await this.testFunction(code as string);
      return new Response(JSON.stringify(result), {
        status: result.success ? 200 : 400,
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // Core functionality
  private async testFunction(code: string): Promise<Record<string, any>> {
    // Basic validation
    try {
      // Parse the code to check for syntax errors
      new Function(code);
      
      // Check for common issues
      const issues: string[] = [];
      if (!code.includes("serve(")) {
        issues.push("Missing Deno.serve or serve function");
      }
      
      // More sophisticated tests could be added here
      
      return {
        success: issues.length === 0,
        errors: issues
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        errors: [errorMessage]
      };
    }
  }

  private async attemptFix(code: string, errors: string[]): Promise<Record<string, any>> {
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
    const testResult = await this.testFunction(fixedCode);
    
    return {
      success: testResult.success,
      code: fixedCode,
      originalErrors: errors,
      remainingErrors: testResult.errors
    };
  }

  private async deployFunction(name: string, code: string, config: Record<string, any> = {}): Promise<Record<string, any>> {
    console.log(`Deploying function: ${name}`);
    
    // Include the function name in the metadata
    // Create FormData for the API request
    const formData = new FormData();
    
    // Prepare metadata
    const metadata = {
      name: name,
      entrypoint_path: "./index.ts",
      verify_jwt: false,
      ...config,
    };
    
    formData.append("metadata", JSON.stringify(metadata));
    
    // Add the function code as a file
    const file = new File([code], "index.ts", { type: "application/typescript" });
    formData.append("file", file);
    
    // Make request to Supabase API
    const projectRef = this.supabaseUrl.split(".")[0].replace("https://", "");
    console.log(`Project ref: ${projectRef}`);
    console.log(`Deploying to: https://api.supabase.com/v1/projects/${projectRef}/functions/deploy`);
    
    let response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/functions/deploy`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`
        },
        body: formData
      }
    );
    
    // If we get a 400 error with entrypoint path, try with a different path format
    if (response.status === 400) {
      const errorData = await response.json();
      console.log(`Error response: ${JSON.stringify(errorData)}`);
      
      if (errorData.message && errorData.message.includes("Entrypoint path does not exist")) {
        // Try with a different entrypoint path format
        metadata.entrypoint_path = "index.ts";
        formData.set("metadata", JSON.stringify(metadata));
        response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/functions/deploy?slug=${name}`, { method: "POST", headers: { "Authorization": `Bearer ${this.accessToken}` }, body: formData });
      }
    }
    
    // Log the response status
    console.log(`Deployment response status: ${response.status}`);
    
    const result = await response.json();
    console.log(`Deployment result: ${JSON.stringify(result)}`);
    
    return result;
  }

  private async deleteFunction(name: string): Promise<Record<string, any>> {
    console.log(`Deleting function: ${name}`);
    
    // Make request to Supabase API to delete a specific function by name
    // Make request to Supabase API
    const projectRef = this.supabaseUrl.split(".")[0].replace("https://", "");
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/functions/${name}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`
        }
      }
    );
    
    return await response.json();
  }

  private async listFunctions(): Promise<Record<string, any>> {
    console.log("Listing functions");
    
    // Make request to Supabase API
    const projectRef = this.supabaseUrl.split(".")[0].replace("https://", "");
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/functions`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${this.accessToken}`
        }
      }
    );
    
    return await response.json();
  }
}