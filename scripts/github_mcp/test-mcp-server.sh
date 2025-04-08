#!/bin/bash

# GitHub MCP Server Test Script
# This script tests if the GitHub MCP server is running correctly

# Default server URL
SERVER_URL=${1:-"http://localhost:3000"}

echo "Testing GitHub MCP Server at $SERVER_URL..."

# Test the server health endpoint
echo "Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $SERVER_URL/health)

if [ "$HEALTH_RESPONSE" == "200" ]; then
  echo "✅ Health check passed!"
else
  echo "❌ Health check failed with status code: $HEALTH_RESPONSE"
  exit 1
fi

# Test the server version endpoint
echo "Testing version endpoint..."
VERSION_RESPONSE=$(curl -s $SERVER_URL/version)
echo "Server version: $VERSION_RESPONSE"

echo "All tests completed successfully!"
echo "GitHub MCP Server is running correctly at $SERVER_URL"