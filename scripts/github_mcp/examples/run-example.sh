#!/bin/bash

# GitHub MCP Server - Example Runner Script
# This script installs dependencies and runs the MCP client example

# Change to the examples directory
cd "$(dirname "$0")"

# Check if node is installed
if ! command -v node &> /dev/null; then
  echo "Error: Node.js is not installed. Please install Node.js to run this example."
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Set environment variables if not already set
if [ -z "$GITHUB_TOKEN" ]; then
  echo "Warning: GITHUB_TOKEN environment variable is not set."
  echo "Some operations may fail without proper authentication."
  echo "You can set it by running: export GITHUB_TOKEN=your_token_here"
fi

# Set MCP server URL if not already set
export MCP_SERVER_URL=${MCP_SERVER_URL:-"http://localhost:3000"}

echo "Running MCP client example against server at $MCP_SERVER_URL..."
node mcp-client-example.js

echo "Example completed!"