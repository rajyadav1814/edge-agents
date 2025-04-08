#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ ! -f .env ]; then
  echo -e "${RED}Error: .env file not found${NC}"
  echo "Please create a .env file with required variables:"
  echo "SUPABASE_PROJECT_ID"
  echo "MCP_SECRET_KEY"
  exit 1
fi

source .env

# Set URLs and auth headers
BASE_URL="https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/mcp-server"

# Function to make a JSON-RPC request
make_jsonrpc_request() {
  local method=$1
  local params=$2
  
  response=$(curl -s -X POST "${BASE_URL}/mcp" \
    -H "Authorization: Bearer ${MCP_SECRET_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
      \"jsonrpc\": \"2.0\",
      \"id\": \"$(uuidgen)\",
      \"method\": \"$method\",
      \"params\": $params
    }")
  
  echo "$response"
}

# Test tool usage
echo -e "${BLUE}Testing tool usage...${NC}"
result=$(make_jsonrpc_request "tool_use" "{\"command\": \"test_command\"}")
echo "$result" | jq '.'
echo

# Test resource access
echo -e "${BLUE}Testing resource access...${NC}"
result=$(make_jsonrpc_request "resource_access" "{\"resourceId\": \"test-resource\"}")
echo "$result" | jq '.'
echo

# Test SSE connection
echo -e "${BLUE}Testing SSE connection...${NC}"
echo "Press Ctrl+C to stop SSE test"
curl -N \
  -H "Authorization: Bearer ${MCP_SECRET_KEY}" \
  -H "Accept: text/event-stream" \
  "${BASE_URL}/mcp"

echo -e "\n${GREEN}Tests completed${NC}"