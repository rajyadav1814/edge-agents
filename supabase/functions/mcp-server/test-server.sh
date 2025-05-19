#!/bin/bash

# Set the MCP_SECRET_KEY environment variable
export MCP_SECRET_KEY="ZTt+jbxIW0bAGL4l2ZM6jBD20O/m8hyj3OCZMjJoWQZ3ZGm2ukXv4Jpn5kdQn8LYlpDfBmYXGkdlw3xN6zAmOw=="

# Start the Deno server in the background
echo "Starting MCP server..."
deno run --allow-net --allow-env index.ts &
SERVER_PID=$!

# Wait for the server to start
sleep 2

# Make a request to the server with the authorization header
echo "Making request to the server status endpoint..."
RESPONSE=$(curl -s -X GET http://localhost:8000/status \
  -H "Authorization: Bearer $MCP_SECRET_KEY")

# Print the response
echo "Server response:"
echo $RESPONSE

# Kill the server process
echo "Stopping server..."
kill $SERVER_PID

echo "Test completed."
