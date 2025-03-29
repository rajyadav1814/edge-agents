/**
 * Main entry point for the gemini-tumbler service
 */

import { load as loadEnv } from "dotenv";
import { TumblerServer } from "./api/server.ts";
import { TumblerConfig, ModelConfig } from "./types/index.ts";

// Load environment variables
await loadEnv({ export: true });

// Default configuration
const defaultConfig: TumblerConfig = {
  rotationInterval: 3600000, // 1 hour in milliseconds
  models: [
    {
      name: "gemini-2.5-pro-exp-03-25",
      provider: "google",
      apiKeyEnvVar: "GEMINI_API_KEY",
      contextWindow: 32000,
      maxOutputTokens: 8192,
      capabilities: ["code", "reasoning", "math", "advanced-reasoning"]
    },
    {
      name: "gemini-1.5-pro",
      provider: "google",
      apiKeyEnvVar: "GEMINI_API_KEY",
      contextWindow: 32000,
      maxOutputTokens: 8192,
      capabilities: ["code", "reasoning", "math"]
    },
    {
      name: "gemini-1.5-flash",
      provider: "google",
      apiKeyEnvVar: "GEMINI_API_KEY",
      contextWindow: 32000,
      maxOutputTokens: 8192,
      capabilities: ["fast-responses", "summarization"]
    }
  ],
  defaultModel: "gemini-2.5-pro-exp-03-25",
  anonymousContribution: true,
  contributionEndpoint: Deno.env.get("CONTRIBUTION_ENDPOINT")
};

// Load custom configuration from environment
function loadConfigFromEnv(): TumblerConfig {
  const config = { ...defaultConfig };
  
  // Load rotation interval
  const rotationInterval = Deno.env.get("ROTATION_INTERVAL");
  if (rotationInterval) {
    config.rotationInterval = parseInt(rotationInterval, 10);
  }
  
  // Load default model
  const defaultModel = Deno.env.get("DEFAULT_MODEL");
  if (defaultModel) {
    config.defaultModel = defaultModel;
  }
  
  // Load anonymous contribution setting
  const anonymousContribution = Deno.env.get("ANONYMOUS_CONTRIBUTION");
  if (anonymousContribution) {
    config.anonymousContribution = anonymousContribution.toLowerCase() === "true";
  }
  
  // Load additional models from environment
  const additionalModelsJson = Deno.env.get("ADDITIONAL_MODELS");
  if (additionalModelsJson) {
    try {
      const additionalModels = JSON.parse(additionalModelsJson) as ModelConfig[];
      config.models = [...config.models, ...additionalModels];
    } catch (error) {
      console.error("Failed to parse ADDITIONAL_MODELS:", error);
    }
  }
  
  return config;
}

// Get port from environment or use default
const port = parseInt(Deno.env.get("PORT") || "3000", 10);

// Load configuration
const config = loadConfigFromEnv();

// Create and start server
const server = new TumblerServer(config, port);

// Display a more visually appealing startup banner
console.log("\n" + "=".repeat(80));
console.log(`🚀 GEMINI TUMBLER SERVICE`.padStart(50, " "));
console.log("=".repeat(80));
console.log(`📋 Configuration:`);
console.log(`   • Available models: ${config.models.map(m => m.name).join(", ")}`);
console.log(`   • Default model: ${config.defaultModel}`);
console.log(`   • Anonymous contribution: ${config.anonymousContribution ? "enabled" : "disabled"}`);
console.log(`   • API rotation interval: ${config.rotationInterval / 60000} minutes`);
console.log("\n" + "-".repeat(80));
console.log(`🔌 API ENDPOINTS:`);
console.log(`   • OpenAI-compatible: http://localhost:${port}/chat/completions`);
console.log(`   • Chat endpoint: http://localhost:${port}/chat`);
console.log(`   • Generate endpoint: http://localhost:${port}/generate`);
console.log(`   • Models list: http://localhost:${port}/models`);
console.log(`   • Health check: http://localhost:${port}/health`);
console.log("-".repeat(80) + "\n");
console.log(`💡 Example curl command:`);
console.log(`curl -X POST http://localhost:${port}/chat/completions \\`);
console.log(`  -H "Content-Type: application/json" \\`);
console.log(`  -d '{"model": "${config.defaultModel}", "messages": [{"role": "user", "content": "Hello!"}]}'`);
console.log("\n" + "=".repeat(80));
console.log(`🌐 Server running at http://localhost:${port}`);
console.log("=".repeat(80) + "\n");

// Handle shutdown signals
Deno.addSignalListener("SIGINT", () => {
  console.log("Shutting down...");
  Deno.exit(0);
});

Deno.addSignalListener("SIGTERM", () => {
  console.log("Shutting down...");
  Deno.exit(0);
});

// Start the server
await server.start();