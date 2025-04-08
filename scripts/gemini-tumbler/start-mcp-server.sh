#!/bin/bash

# Script to start the MCP server for Gemini Tumbler

# Default values if not set in environment
export MCP_PORT=${MCP_PORT:-4000}
export MCP_AUTH_TOKEN=${MCP_AUTH_TOKEN:-"development-token"}

echo "Starting MCP server on port $MCP_PORT..."

# Run the MCP server with .env support
deno run \
  --allow-net \
  --allow-env \
  --allow-read \
  --env-file=.env \
  src/mcp/startMcpServer.ts