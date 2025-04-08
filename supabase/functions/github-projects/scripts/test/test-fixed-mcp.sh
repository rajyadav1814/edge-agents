#!/bin/bash

# Test script for the GitHub Projects MCP server with fixed mutation
# This script tests the createProject tool without description parameter

# Load environment variables if .env file exists
if [ -f "../../.env" ]; then
  export $(grep -v '^#' ../../.env | xargs)
fi

echo "Testing createProject without description parameter..."

# Kill any existing MCP server processes
pkill -f "node.*mcp-stdio-server.js" || true

# Build the project first
echo "Building the project..."
cd /workspaces/edge-agents/supabase/functions/github-projects
node build.js

# Start the MCP stdio server in the background
echo "Starting MCP stdio server..."
node dist/mcp-stdio-server.js > /tmp/mcp-output.log 2>&1 &
MCP_PID=$!

# Give the server time to start
sleep 2

# Create a test project using the MCP CLI
echo "Creating test project without description parameter..."
echo '{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "mcp.tools.call",
  "params": {
    "name": "createProject",
    "arguments": {
      "organization": "${GITHUB_ORG:-example-org}",
      "title": "MCP Test Project"
    }
  }
}' | nc -U /tmp/mcp.sock > /tmp/mcp-response.log

# Display the response
echo "MCP Response:"
cat /tmp/mcp-response.log

# Check if the response contains an error
if grep -q "error" /tmp/mcp-response.log; then
  echo "❌ FAILURE: Error in MCP response"
  cat /tmp/mcp-output.log
  kill $MCP_PID
  exit 1
else
  echo "✅ SUCCESS: Project created successfully without description parameter!"
fi

# Kill the MCP server
echo "Cleaning up..."
kill $MCP_PID

echo "Test completed."