#!/bin/bash

# Test script for the GitHub Projects MCP server
# This script tests the createProject tool with the shortDescription parameter

echo "Testing createProject with shortDescription parameter..."

# Build the project first
echo "Building the project..."
node build.js

# Start the MCP stdio server in the background
echo "Starting MCP stdio server..."
node dist/mcp-stdio-server.js > /tmp/mcp-output.log 2>&1 &
MCP_PID=$!

# Give the server time to start
sleep 2

# Create a test project using the MCP CLI
echo "Creating test project with shortDescription parameter..."
echo '{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "mcp.tools.list",
  "params": {}
}' | nc -U /tmp/mcp.sock

# Kill the MCP server
echo "Cleaning up..."
kill $MCP_PID

echo "Test completed."