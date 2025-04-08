#!/bin/bash
# Run MCP-specific tests

set -e

echo "Running MCP server tests..."
cd "$(dirname "$0")/.."

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
  echo "Deno is not installed. Please install Deno first."
  exit 1
fi

# Run the MCP server test
echo "Testing MCP discovery endpoint and parameter naming..."
deno test --allow-read --allow-net tests/mcp-server-test.js

# Run the integration test for createProject
echo "Testing GraphQL mutation parameter naming..."
deno test --allow-read --allow-net --allow-env tests/integration/create-project-mcp.test.ts

echo "All MCP tests completed successfully!"