#!/usr/bin/env node
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { SPARC2MCPServer } from './mcp/server.js';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🎉 Welcome to SPARC2 MCP, by the Agentics Foundation!
console.log("======================================================");
console.log(" SPARC2 MCP - SPARC2 with Model Context Protocol");
console.log(" Created by Agentics Foundation");
console.log("======================================================");

// 🔹 Step 1: Load environment variables
const envPath = process.env.SPARC2_ENV_PATH || path.resolve(__dirname, '../config/.env');
config({ path: envPath });
console.log("🔹 Step 1: Environment variables loaded from", envPath);

// 🔹 Step 2: Read necessary environment variables
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const E2B_API_KEY = process.env.E2B_API_KEY;
const MCP_SECRET_KEY = process.env.MCP_SECRET_KEY;

// Validate required environment variables
if (!OPENAI_API_KEY) {
  console.error("❌ Missing required environment variable: OPENAI_API_KEY");
  process.exit(1);
}

if (!E2B_API_KEY) {
  console.error("❌ Missing required environment variable: E2B_API_KEY");
  process.exit(1);
}

console.log("🔹 Step 2: Environment variables verified.");

// 🔹 Step 3: Load configuration files
const configPath = process.env.SPARC2_CONFIG_PATH || path.resolve(__dirname, '../config/config.toml');
const agentConfigPath = process.env.SPARC2_AGENT_CONFIG_PATH || path.resolve(__dirname, '../config/agent-config.toml');

console.log("🔹 Step 3: Configuration files loaded from:", {
  config: configPath,
  agentConfig: agentConfigPath
});

// 🔹 Step 4: Initialize SPARC2 MCP Server
const server = new SPARC2MCPServer({
  name: 'sparc2-mcp',
  version: '1.0.0',
  openai: {
    apiKey: OPENAI_API_KEY,
    defaultModel: process.env.OPENAI_MODEL || 'gpt-4o'
  },
  e2b: {
    apiKey: E2B_API_KEY
  },
  mcp: {
    secretKey: MCP_SECRET_KEY
  },
  configPath,
  agentConfigPath,
  tracing: {
    enabled: process.env.ENABLE_TRACING === 'true',
    level: (process.env.TRACING_LEVEL as 'debug' | 'info' | 'error') || 'info'
  },
  tools: {
    enabled: ['analyze', 'modify', 'execute', 'checkpoint', 'rollback', 'search', 'config'],
    config: {
      openai: {
        apiKey: OPENAI_API_KEY
      },
      e2b: {
        apiKey: E2B_API_KEY
      }
    }
  },
  guardrails: {
    enabled: true,
    rules: []
  }
});
console.log("🔹 Step 4: SPARC2 MCP Server initialized.");

// 🔹 Step 5: Start the MCP Server
console.log("🚀 Starting SPARC2 MCP Server ...");
server.serve().catch(error => {
  console.error("❌ Server error:", error);
  process.exit(1);
});