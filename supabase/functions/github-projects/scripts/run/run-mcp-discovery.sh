#!/bin/bash

echo "Starting GitHub Projects MCP Discovery Server"

# Set the port for the MCP discovery server
MCP_PORT=8002

# Stop any existing Deno processes on the MCP port
echo "Stopping any existing Deno processes on port ${MCP_PORT}..."
pkill -f "deno.*${MCP_PORT}" || true

# Start the MCP discovery server
echo "Starting MCP Discovery server on port ${MCP_PORT}..."
echo "Server will be available at http://localhost:${MCP_PORT}/"
echo "Press Ctrl+C to stop the server"

# Run the MCP discovery server
deno run --allow-net mcp-discovery-server.ts