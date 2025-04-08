#!/bin/bash
# Run the simple MCP server with environment variables

# Load environment variables from .env file
if [ -f ../.env ]; then
  export $(grep -v '^#' ../.env | xargs)
  echo "Loaded environment variables from ../.env"
elif [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "Loaded environment variables from .env"
else
  echo "Warning: No .env file found"
fi

echo "Starting MCP Discovery server on port 8002..."
echo "GitHub Token: ${GITHUB_TOKEN:0:10}..."
echo "GitHub Org: $GITHUB_ORG"

node simple-mcp-server.js