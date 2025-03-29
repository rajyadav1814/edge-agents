#!/usr/bin/env node

/**
 * MCP Server Wrapper for SPARC 2.0
 * This script uses the MCP SDK to create a server that communicates over stdio
 * and forwards requests to the SPARC2 HTTP API server.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ErrorCode, McpError } from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import path from "path";
import http from "http";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { execSync } from "child_process";

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Start the SPARC2 HTTP server
let httpServerProcess = null;

// Global flag to track if we're shutting down intentionally
let isShuttingDown = false;

/**
 * Find the Deno executable by checking multiple common installation locations
 * Falls back to the original path if no Deno installation is found
 * @returns {string|null} Path to the Deno executable or null if not found
 */
function findDenoExecutable() {
  const possiblePaths = [
    // Common paths for Deno installation
    "/home/codespace/.deno/bin/deno", // GitHub Codespaces (original path)
    "/usr/local/bin/deno", // Standard Linux/macOS location
    "/usr/bin/deno", // Alternative Linux location
    process.env.HOME ? path.join(process.env.HOME, ".deno/bin/deno") : null, // User home directory
    process.env.DENO_INSTALL_ROOT ? path.join(process.env.DENO_INSTALL_ROOT, "bin/deno") : null,
    // Windows paths (with .exe extension)
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, ".deno", "bin", "deno.exe") : null,
    "C:\\Program Files\\deno\\deno.exe",
    // Try the command directly (relies on PATH)
    "deno",
  ].filter(Boolean); // Remove null entries

  // First check if specific paths exist
  for (const denoPath of possiblePaths.slice(0, -1)) { // All except the last one
    try {
      if (existsSync(denoPath)) {
        console.error(`[MCP Wrapper] Found Deno at: ${denoPath}`);
        return denoPath;
      }
    } catch (error) {
      // Ignore errors checking file existence
    }
  }

  // Finally, try 'deno' command directly (which relies on PATH)
  try {
    execSync("deno --version", { stdio: "ignore" });
    console.error("[MCP Wrapper] Using Deno from PATH");
    return "deno";
  } catch (error) {
    // If we can't find deno anywhere, return null
    console.error("[MCP Wrapper] Deno not found in any standard location");
    return null;
  }
}

/**
 * Prints installation instructions for Deno
 */
function printDenoInstallInstructions() {
  console.error("\n========== DENO NOT FOUND ==========");
  console.error(
    "SPARC2 requires Deno to run. Please install Deno using one of the following methods:",
  );
  console.error("\nLinux/macOS:");
  console.error("  curl -fsSL https://deno.land/install.sh | sh");
  console.error("\nWindows (PowerShell):");
  console.error("  irm https://deno.land/install.ps1 | iex");
  console.error("\nUsing Homebrew (macOS/Linux):");
  console.error("  brew install deno");
  console.error("\nUsing Chocolatey (Windows):");
  console.error("  choco install deno");
  console.error("\nUsing Scoop (Windows):");
  console.error("  scoop install deno");
  console.error(
    "\nAfter installation, you may need to restart your terminal or add Deno to your PATH.",
  );
  console.error("For more information, visit: https://deno.land/#installation");
  console.error("=====================================\n");
}

// Function to start the HTTP server
async function startHttpServer() {
  return new Promise((resolve, reject) => {
    // Get the directory of this script
    const scriptDir = path.resolve(__dirname, "../..");

    // Find the Deno executable
    const denoPath = findDenoExecutable();

    // Check if Deno is installed
    if (!denoPath) {
      printDenoInstallInstructions();
      reject(new Error("Deno is not installed. Please install Deno and try again."));
      return;
    }

    // IMPORTANT: Start the HTTP API server directly, not the MCP server
    // This avoids the circular dependency where the MCP server tries to start this wrapper
    httpServerProcess = spawn(denoPath, [
      "run",
      "--allow-read",
      "--allow-write",
      "--allow-env",
      "--allow-net",
      "--allow-run",
      path.join(scriptDir, "src", "cli", "cli.ts"),
      "api", // Use the API command instead of MCP command
      "--port",
      "3001",
    ], {
      cwd: scriptDir,
      stdio: "pipe",
      env: {
        ...process.env,
        // Set a flag to prevent the API server from starting the MCP server
        SPARC2_DIRECT_API: "true",
      },
    });

    // Create a server start timeout
    const serverStartTimeout = setTimeout(() => {
      reject(new Error("HTTP server failed to start within 30 seconds"));
    }, 30000);

    // Handle server output
    httpServerProcess.stdout.on("data", (data) => {
      console.error(`[HTTP Server] ${data.toString().trim()}`);

      // Check if the server is listening
      if (data.toString().includes("Listening on http://localhost:3001")) {
        clearTimeout(serverStartTimeout);
        resolve();
      }
    });

    httpServerProcess.stderr.on("data", (data) => {
      // Prevent feedback loop by not logging messages that contain "[MCP Wrapper]"
      const message = data.toString().trim();
      if (!message.includes("[MCP Wrapper]")) {
        console.error(`[HTTP Server Error] ${message}`);
      }
    });

    httpServerProcess.on("error", (error) => {
      console.error(`[HTTP Server Process Error] ${error.message}`);
      clearTimeout(serverStartTimeout);
      reject(error);
    });

    httpServerProcess.on("close", (code) => {
      console.error(`[HTTP Server Process Exited] with code ${code}`);
      clearTimeout(serverStartTimeout);

      // Don't restart if exit was clean (code 0) or if we're shutting down
      if (code !== 0 && !isShuttingDown) {
        console.error(`[MCP Wrapper] HTTP server exited unexpectedly.`);
        reject(new Error(`HTTP server exited with code ${code}`));
      }

      httpServerProcess = null;
    });
  });
}

// Function to make an HTTP request to the SPARC2 HTTP server
async function makeHttpRequest(endpoint, method = "GET", body = null) {
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const options = {
          hostname: "localhost",
          port: 3001,
          path: `/${endpoint}`,
          method: method,
          headers: {
            "Content-Type": "application/json",
          },
          // Add a timeout to the request
          timeout: 10000,
        };

        const req = http.request(options, (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch (error) {
                resolve(data);
              }
            } else {
              reject(new Error(`HTTP Error: ${res.statusCode} - ${data}`));
            }
          });
        });

        req.on("error", (error) => {
          reject(error);
        });

        req.on("timeout", () => {
          req.destroy();
          reject(new Error("Request timed out"));
        });

        if (body) {
          req.write(JSON.stringify(body));
        }

        req.end();
      });
    } catch (error) {
      lastError = error;
      if (attempt === maxRetries) {
        throw error;
      }
      console.error(
        `[MCP Wrapper] Request to ${endpoint} failed (attempt ${attempt}/${maxRetries}): ${error.message}. Retrying...`,
      );
      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
    }
  }

  // This should never be reached due to the throw in the loop, but just in case
  throw lastError;
}

// Create the MCP server
const server = new Server(
  {
    name: "sparc2-mcp",
    version: "2.0.5",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

// Set up the ListTools request handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  try {
    // Get the tools from the HTTP server
    const response = await makeHttpRequest("discover", "GET");

    return {
      tools: response.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.parameters,
      })),
    };
  } catch (error) {
    console.error(`[MCP Server Error] Failed to list tools: ${error.message}`);
    throw new McpError(ErrorCode.InternalError, `Failed to list tools: ${error.message}`);
  }
});

// Set up the CallTool request handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const toolName = request.params.name;
    const args = request.params.arguments;

    // Map the tool name to the corresponding HTTP endpoint
    let endpoint;
    switch (toolName) {
      case "analyze_code":
        endpoint = "analyze";
        break;
      case "modify_code":
        endpoint = "modify";
        break;
      case "execute_code":
        endpoint = "execute";
        break;
      case "search_code":
        endpoint = "search";
        break;
      case "create_checkpoint":
        endpoint = "checkpoint";
        break;
      case "rollback":
        endpoint = "rollback";
        break;
      case "config":
        endpoint = "config";
        break;
      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${toolName}`);
    }

    // Make the HTTP request to the SPARC2 HTTP server
    const response = await makeHttpRequest(endpoint, "POST", args);

    // Format the response
    return {
      content: [
        {
          type: "text",
          text: typeof response === "string" ? response : JSON.stringify(response, null, 2),
        },
      ],
    };
  } catch (error) {
    console.error(`[MCP Server Error] Failed to call tool: ${error.message}`);
    throw new McpError(ErrorCode.InternalError, `Failed to call tool: ${error.message}`);
  }
});

// Set up error handler
server.onerror = (error) => {
  console.error(`[MCP Server Error] ${error}`);
};

// Main function
async function main() {
  try {
    // Start the HTTP server
    console.error("[MCP Wrapper] Starting HTTP API server...");
    await startHttpServer();
    console.error("[MCP Wrapper] HTTP API server started");

    // Connect to the stdio transport
    console.error("[MCP Wrapper] Connecting to stdio transport...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[MCP Wrapper] SPARC2 MCP server running on stdio");

    // Handle process exit
    process.on("SIGINT", async () => {
      isShuttingDown = true;
      console.error("[MCP Wrapper] Shutting down...");
      if (httpServerProcess) {
        httpServerProcess.kill();
      }
      await server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error(`[MCP Wrapper Error] ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  console.error(`[MCP Wrapper Unhandled Error] ${error.message}`);
  process.exit(1);
});
