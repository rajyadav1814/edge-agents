#!/bin/bash

echo "Starting GitHub Projects API and MCP Discovery Servers"

# Start the main GitHub API server in the background
echo "Starting GitHub API server..."
./run-server.sh &
GITHUB_API_PID=$!

# Wait a moment for the first server to initialize
sleep 2

# Start the MCP discovery server in the background
echo "Starting MCP Discovery server..."
./run-simple-mcp.sh &
MCP_DISCOVERY_PID=$!

# Function to handle script termination
cleanup() {
  echo "Stopping servers..."
  kill $GITHUB_API_PID 2>/dev/null || true
  kill $MCP_DISCOVERY_PID 2>/dev/null || true
  exit 0
}

# Set up trap to catch termination signals
trap cleanup SIGINT SIGTERM

echo "All servers are running. Press Ctrl+C to stop all servers."
echo "GitHub API server is available at: http://localhost:8001/github-api/"
echo "MCP Discovery server is available at: http://localhost:8002/"

# Keep the script running
wait