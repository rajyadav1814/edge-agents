#!/bin/bash
# Run the MCP stdio server with environment variables

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

echo "Starting MCP stdio server..."
echo "GitHub Token: ${GITHUB_TOKEN:0:10}..."
echo "GitHub Org: $GITHUB_ORG"

node mcp-stdio-server.js