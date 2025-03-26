/**
 * MCP Server module for SPARC 2.0
 * Implements a Model Context Protocol server for SPARC2
 */

import { serve } from "https://deno.land/std@0.215.0/http/server.ts";
import { FileToProcess, SPARC2Agent } from "../agent/agent.ts";
import { logDebug, logError, logInfo } from "../logger.ts";
import { executeCode } from "../sandbox/codeInterpreter.ts";
import { createCheckpoint } from "../git/gitIntegration.ts";

// Default port for the MCP server
const DEFAULT_PORT = 3001;

/**
 * MCP Tool definition
 */
interface MCPTool {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required?: string[];
  };
  returns?: {
    type: string;
    description: string;
  };
}

/**
 * MCP Resource definition
 */
interface MCPResource {
  name: string;
  type: string;
  description: string;
  properties: Record<string, {
    type: string;
    description: string;
  }>;
  methods?: Array<{
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, {
        type: string;
        description: string;
      }>;
      required?: string[];
    };
    returns?: {
      type: string;
      description: string;
    };
  }>;
}

/**
 * Start the MCP server
 * @param options Server options
 * @returns Promise that resolves when the server is started
 */
export async function startMCPServer(options: {
  port?: number;
  model?: string;
  mode?: "automatic" | "semi" | "manual" | "custom" | "interactive";
  diffMode?: "file" | "function";
  processing?: "sequential" | "parallel" | "concurrent" | "swarm";
  configPath?: string;
}): Promise<void> {
  const port = options.port || DEFAULT_PORT;

  // Initialize SPARC2 agent
  const agent = new SPARC2Agent({
    model: options.model || "gpt-4o",
    mode: options.mode || "automatic",
    diffMode: options.diffMode || "file",
    processing: options.processing || "sequential",
    configPath: "./config/agent-config.toml",
  });

  // Initialize the agent
  await agent.init();

  await logInfo("Starting SPARC2 MCP server on port " + port);

  // Define available tools
  const tools: MCPTool[] = [
    {
      name: "analyze_code",
      description: "Analyze code files for issues and improvements",
      parameters: {
        type: "object",
        properties: {
          files: {
            type: "array",
            description: "Array of file paths to analyze",
          },
          task: {
            type: "string",
            description: "Description of the analysis task",
          },
        },
        required: ["files"],
      },
      returns: {
        type: "object",
        description: "Analysis results with suggestions for improvements",
      },
    },
    {
      name: "modify_code",
      description: "Apply suggested modifications to code files",
      parameters: {
        type: "object",
        properties: {
          files: {
            type: "array",
            description: "Array of file paths to modify",
          },
          task: {
            type: "string",
            description: "Description of the modification task",
          },
        },
        required: ["files"],
      },
      returns: {
        type: "object",
        description: "Results of the modifications applied",
      },
    },
    {
      name: "execute_code",
      description: "Execute code in a secure sandbox",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "Code to execute",
          },
          language: {
            type: "string",
            description: "Programming language (python, javascript, typescript)",
          },
        },
        required: ["code", "language"],
      },
      returns: {
        type: "object",
        description: "Execution results including stdout, stderr, and any errors",
      },
    },
    {
      name: "search_code",
      description: "Search for similar code changes",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
          limit: {
            type: "number",
            description: "Maximum number of results to return",
          },
        },
        required: ["query"],
      },
      returns: {
        type: "array",
        description: "Array of search results with relevance scores",
      },
    },
    {
      name: "create_checkpoint",
      description: "Create a version control checkpoint",
      parameters: {
        type: "object",
        properties: {
          message: {
            type: "string",
            description: "Checkpoint message",
          },
        },
        required: ["message"],
      },
      returns: {
        type: "object",
        description: "Checkpoint information including commit hash",
      },
    },
    {
      name: "rollback",
      description: "Roll back to a previous checkpoint",
      parameters: {
        type: "object",
        properties: {
          commit: {
            type: "string",
            description: "Commit hash to roll back to",
          },
        },
        required: ["commit"],
      },
      returns: {
        type: "object",
        description: "Result of the rollback operation",
      },
    },
    {
      name: "config",
      description: "Manage configuration",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            description: "Action to perform (get, set, list)",
          },
          key: {
            type: "string",
            description: "Configuration key",
          },
          value: {
            type: "string",
            description: "Configuration value (for set action)",
          },
        },
        required: ["action"],
      },
      returns: {
        type: "object",
        description: "Configuration operation result",
      },
    },
  ];

  // Define available resources
  const resources: MCPResource[] = [
    {
      name: "git_repository",
      type: "version_control",
      description: "Git repository for version control and checkpointing",
      properties: {
        path: {
          type: "string",
          description: "Path to the git repository",
        },
        branch: {
          type: "string",
          description: "Current branch name",
        },
      },
      methods: [
        {
          name: "create_checkpoint",
          description: "Create a checkpoint in the git repository",
          parameters: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Name of the checkpoint",
              },
            },
            required: ["name"],
          },
          returns: {
            type: "object",
            description: "Checkpoint information including commit hash",
          },
        },
        {
          name: "rollback",
          description: "Roll back to a previous checkpoint",
          parameters: {
            type: "object",
            properties: {
              commit: {
                type: "string",
                description: "Commit hash to roll back to",
              },
            },
            required: ["commit"],
          },
          returns: {
            type: "object",
            description: "Result of the rollback operation",
          },
        },
      ],
    },
    {
      name: "vector_store",
      type: "database",
      description: "Vector database for storing and searching code changes and logs",
      properties: {
        id: {
          type: "string",
          description: "ID of the vector store",
        },
        size: {
          type: "number",
          description: "Number of entries in the vector store",
        },
      },
      methods: [
        {
          name: "search",
          description: "Search for similar entries in the vector store",
          parameters: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query",
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return",
              },
            },
            required: ["query"],
          },
          returns: {
            type: "array",
            description: "Array of search results with relevance scores",
          },
        },
        {
          name: "index",
          description: "Index a new entry in the vector store",
          parameters: {
            type: "object",
            properties: {
              content: {
                type: "string",
                description: "Content to index",
              },
              metadata: {
                type: "object",
                description: "Metadata for the entry",
              },
            },
            required: ["content"],
          },
          returns: {
            type: "object",
            description: "Result of the indexing operation",
          },
        },
      ],
    },
    {
      name: "sandbox",
      type: "execution_environment",
      description: "Secure sandbox for executing code",
      properties: {
        languages: {
          type: "array",
          description: "Supported programming languages",
        },
        timeout: {
          type: "number",
          description: "Maximum execution time in seconds",
        },
      },
      methods: [
        {
          name: "execute",
          description: "Execute code in the sandbox",
          parameters: {
            type: "object",
            properties: {
              code: {
                type: "string",
                description: "Code to execute",
              },
              language: {
                type: "string",
                description: "Programming language",
              },
            },
            required: ["code", "language"],
          },
          returns: {
            type: "object",
            description: "Execution results including stdout, stderr, and any errors",
          },
        },
      ],
    },
  ];

  // Start the HTTP server
  await serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Handle discovery endpoint
    if (
      (req.url.endsWith("/discover") || req.url.endsWith("/capabilities")) && req.method === "GET"
    ) {
      return new Response(
        JSON.stringify({
          tools,
          resources,
          version: "2.0.5",
          name: "SPARC2 MCP Server",
          description: "Model Context Protocol server for SPARC2",
        }),
        {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        },
      );
    }

    // Handle list_tools endpoint (legacy)
    if (req.url.endsWith("/list_tools") && req.method === "GET") {
      return new Response(JSON.stringify({ tools }), {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Handle analyze endpoint
    if (req.url.endsWith("/analyze") && req.method === "POST") {
      try {
        const body = await req.json();
        const { files, task } = body;

        if (!files || !Array.isArray(files) || files.length === 0) {
          return new Response(JSON.stringify({ error: "Files array is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Convert file paths to FileToProcess objects
        const filesToProcess: FileToProcess[] = [];

        for (const file of files) {
          try {
            const content = await Deno.readTextFile(file);
            filesToProcess.push({
              path: file,
              originalContent: content,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await logError(`Error reading file ${file}: ${errorMessage}`);
            return new Response(JSON.stringify({ error: `Failed to read file: ${errorMessage}` }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // Use planAndExecute to analyze the files
        const results = await agent.planAndExecute(
          `Analyze the following files: ${task}`,
          filesToProcess,
        );

        // Convert the results to the expected format
        const formattedResults = results.map((result) => ({
          file: result.path,
          issues: result.originalContent !== result.modifiedContent ? ["Changes suggested"] : [],
          suggestions: result.originalContent !== result.modifiedContent
            ? [result.modifiedContent]
            : [],
        }));

        return new Response(JSON.stringify(formattedResults), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logError(`Error analyzing code: ${errorMessage}`);
        return new Response(JSON.stringify({ error: `Failed to analyze code: ${errorMessage}` }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle modify endpoint
    if (req.url.endsWith("/modify") && req.method === "POST") {
      try {
        const body = await req.json();
        const { files, task } = body;

        if (!files || !Array.isArray(files) || files.length === 0) {
          return new Response(JSON.stringify({ error: "Files array is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Convert file paths to FileToProcess objects
        const filesToProcess: FileToProcess[] = [];

        for (const file of files) {
          try {
            const content = await Deno.readTextFile(file);
            filesToProcess.push({
              path: file,
              originalContent: content,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            await logError(`Error reading file ${file}: ${errorMessage}`);
            return new Response(JSON.stringify({ error: `Failed to read file: ${errorMessage}` }), {
              status: 500,
              headers: { "Content-Type": "application/json" },
            });
          }
        }

        // Use planAndExecute to modify the files
        const results = await agent.planAndExecute(
          `Modify the following files: ${task}`,
          filesToProcess,
        );

        // Write the modified content back to the files
        for (const result of results) {
          if (result.originalContent !== result.modifiedContent) {
            await Deno.writeTextFile(result.path, result.modifiedContent);
          }
        }

        // Process the results
        const processedResults = results.map((result) => ({
          file: result.path,
          modified: result.originalContent !== result.modifiedContent,
          changes: result.originalContent !== result.modifiedContent
            ? ["File was modified according to suggestions"]
            : [],
        }));

        return new Response(JSON.stringify(processedResults), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logError(`Error modifying code: ${errorMessage}`);
        return new Response(JSON.stringify({ error: `Failed to modify code: ${errorMessage}` }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle execute endpoint
    if (req.url.endsWith("/execute") && req.method === "POST") {
      try {
        const body = await req.json();
        const { code, language = "javascript" } = body;

        if (!code) {
          return new Response(JSON.stringify({ error: "Code is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Execute the code directly using the code interpreter
        const result = await executeCode(code, { language });

        // Format the output
        let output = "";
        if (result.logs.stdout.length > 0) {
          output += result.logs.stdout.join("\n");
        }
        if (result.logs.stderr.length > 0) {
          output += "\n\nErrors:\n" + result.logs.stderr.join("\n");
        }
        if (result.error) {
          output += "\n\nExecution Error:\n" + result.error.value;
        }

        // Return the execution result
        return new Response(
          JSON.stringify({
            result: output || "Execution completed successfully",
            details: result,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logError(`Error executing code: ${errorMessage}`);
        return new Response(JSON.stringify({ error: `Failed to execute code: ${errorMessage}` }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle search endpoint
    if (req.url.endsWith("/search") && req.method === "POST") {
      try {
        const body = await req.json();
        const { query, limit = 10 } = body;

        if (!query) {
          return new Response(JSON.stringify({ error: "Search query is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Import the vector search function
        const { searchVectorStore } = await import("../vector/vectorStore.ts");

        // Perform the search
        const results = await searchVectorStore(query, limit);

        return new Response(JSON.stringify(results), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logError(`Error searching code: ${errorMessage}`);
        return new Response(JSON.stringify({ error: `Failed to search code: ${errorMessage}` }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle rollback endpoint
    if (req.url.endsWith("/rollback") && req.method === "POST") {
      try {
        const body = await req.json();
        const { commit } = body;

        if (!commit) {
          return new Response(JSON.stringify({ error: "Commit hash is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Import the rollback function
        const { rollbackChanges } = await import("../git/gitIntegration.ts");

        // Perform the rollback
        const message = `Rollback to ${commit}`;
        const result = await rollbackChanges(commit, message);

        return new Response(
          JSON.stringify({
            commit,
            success: true,
            result,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logError(`Error rolling back changes: ${errorMessage}`);
        return new Response(
          JSON.stringify({ error: `Failed to roll back changes: ${errorMessage}` }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Handle checkpoint endpoint
    if (req.url.endsWith("/checkpoint") && req.method === "POST") {
      try {
        const body = await req.json();
        const { name } = body;

        if (!name) {
          return new Response(JSON.stringify({ error: "Checkpoint name is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Sanitize the name for Git tag
        const sanitizedName = name.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase().substring(0, 50);

        // Create a checkpoint
        const hash = await createCheckpoint(sanitizedName);

        return new Response(
          JSON.stringify({
            name: sanitizedName,
            hash: hash,
          }),
          {
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logError(`Error creating checkpoint: ${errorMessage}`);
        return new Response(
          JSON.stringify({ error: `Failed to create checkpoint: ${errorMessage}` }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    // Handle config endpoint
    if (req.url.endsWith("/config") && req.method === "POST") {
      try {
        const body = await req.json();
        const { action, key, value } = body;

        if (!action) {
          return new Response(JSON.stringify({ error: "Action is required" }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Handle different config actions
        if (action === "get") {
          // Get a specific config value
          if (!key) {
            return new Response(JSON.stringify({ error: "Key is required for get action" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const configValue = Deno.env.get(key) || null;
          return new Response(JSON.stringify({ key, value: configValue }), {
            headers: { "Content-Type": "application/json" },
          });
        } else if (action === "set") {
          // Set a specific config value
          if (!key) {
            return new Response(JSON.stringify({ error: "Key is required for set action" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          if (value === undefined) {
            return new Response(JSON.stringify({ error: "Value is required for set action" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Set the environment variable
          Deno.env.set(key, String(value));

          return new Response(JSON.stringify({ key, value, success: true }), {
            headers: { "Content-Type": "application/json" },
          });
        } else if (action === "list") {
          // List all config values (only safe ones)
          const safeKeys = [
            "DENO_ENV",
            "DEBUG",
            "LOG_LEVEL",
            "VECTOR_STORE_ID",
            "DIFF_MODE",
            "PROCESSING_MODE",
          ];

          const config: Record<string, string | null> = {};
          for (const key of safeKeys) {
            config[key] = Deno.env.get(key) || null;
          }

          return new Response(JSON.stringify(config), {
            headers: { "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await logError(`Error managing config: ${errorMessage}`);
        return new Response(JSON.stringify({ error: `Failed to manage config: ${errorMessage}` }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Handle unknown endpoints
    return new Response(JSON.stringify({ error: "Endpoint not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }, { port });

  await logInfo(`SPARC2 MCP server running on http://localhost:${port}`);
}
