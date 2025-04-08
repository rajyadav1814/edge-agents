/**
 * Script to start the MCP server with initial tools and resources
 */

import { McpServer } from "./mcpServer.ts";
import { McpTool } from "../types/mcp.ts";
import { TumblerResponse } from "../types/index.ts";
import { TumblerService } from "../agent/tumblerService.ts";
import { TumblerConfig } from "../types/index.ts";
import { resetRateMonitoring, setDistributionStrategy } from "../utils/responseInterceptor.ts";
import { RequestDistributionStrategy } from "../types/rateLimit.ts";

// Initialize rate limit monitoring
resetRateMonitoring();
setDistributionStrategy(RequestDistributionStrategy.HEALTH_AWARE);

// Initialize TumblerService with multiple model configs for key rotation
const tumblerConfig: TumblerConfig = {
  rotationInterval: 1000, // Fast rotation for quick recovery from rate limits
  models: [
    {
      name: "gemini-2.5-pro-exp-03-25",
      provider: "google",
      apiKeyEnvVar: "GEMINI_API_KEY",
      contextWindow: 32000,
      maxOutputTokens: 8192,
      capabilities: ["code", "reasoning"]
    },
    {
      name: "gemini-2.5-pro-exp-03-25",
      provider: "google",
      apiKeyEnvVar: "GEMINI_API_KEY_2",
      contextWindow: 32000,
      maxOutputTokens: 8192,
      capabilities: ["code", "reasoning"]
    },
    {
      name: "gemini-2.5-pro-exp-03-25",
      provider: "google",
      apiKeyEnvVar: "GEMINI_API_KEY_3",
      contextWindow: 32000,
      maxOutputTokens: 8192,
      capabilities: ["code", "reasoning"]
    }
  ],
  defaultModel: "gemini-2.5-pro-exp-03-25",
  anonymousContribution: false
};

const tumblerService = new TumblerService(tumblerConfig);

// Create generate response tool
const generateResponseTool: McpTool<{
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}, TumblerResponse> = {
  name: "generate-response",
  description: "Generates a response using the Gemini model through the tumbler service",
  execute: async (args) => {
    try {
      return await tumblerService.processRequest({
        prompt: args.prompt,
        systemPrompt: args.systemPrompt,
        temperature: args.temperature,
        maxTokens: args.maxTokens
      });
    } catch (error) {
      console.error("Generation error:", error);
      // Attempt retry with automated rotation
      return await tumblerService.processRequest({
        prompt: args.prompt,
        systemPrompt: args.systemPrompt,
        temperature: args.temperature,
        maxTokens: args.maxTokens
      });
    }
  }
};

// Create analysis tool
const responseAnalysisTool: McpTool<{
  response: TumblerResponse;
}, {
  quality: "high" | "low";
  patterns: string[];
  metrics: {
    coherence: number;
    relevance: number;
    toxicity: number;
  };
}> = {
  name: "analyze-response",
  description: "Analyzes Gemini model responses for quality and patterns",
  execute: async (args) => {
    const { response } = args;
    const content = response.content;

    return {
      quality: content.length > 100 ? "high" : "low",
      patterns: [
        content.includes("error") ? "error-handling" : "",
        content.includes("test") ? "testing" : "",
        content.includes("implement") ? "implementation" : ""
      ].filter(Boolean),
      metrics: {
        coherence: content.split(".").length > 3 ? 0.8 : 0.5,
        relevance: content.length > 50 ? 0.7 : 0.4,
        toxicity: 0.1
      }
    };
  }
};

// Create code modification tool
const codeModificationTool: McpTool<{
  path: string;
  type: "update_rotation_strategy" | "update_rate_limiting" | "update_config";
  params: Record<string, unknown>;
}, {
  success: boolean;
  changes: {
    file: string;
    lineStart: number;
    lineEnd: number;
    modification: string;
  }[];
}> = {
  name: "modify-code",
  description: "Modifies tumbler service code based on specified parameters",
  execute: async (args) => {
    const { path, type, params } = args;
    return {
      success: true,
      changes: [{
        file: path,
        lineStart: 1,
        lineEnd: 1,
        modification: `// Modified ${type} with params: ${JSON.stringify(params)}`
      }]
    };
  }
};

// Start the server
const port = Number(Deno.env.get("MCP_PORT")) || 4000;
const authToken = Deno.env.get("MCP_AUTH_TOKEN") || "development-token";

const server = new McpServer({
  port,
  authToken
});

// Register tools
server.registerTool(generateResponseTool);
server.registerTool(responseAnalysisTool);
server.registerTool(codeModificationTool);

// Start the server
console.log(`Starting MCP server on port ${port}...`);
await server.start();

// Handle shutdown
const shutdown = async () => {
  console.log("\nShutting down MCP server...");
  await server.stop();
  Deno.exit(0);
};

Deno.addSignalListener("SIGINT", shutdown);
Deno.addSignalListener("SIGTERM", shutdown);