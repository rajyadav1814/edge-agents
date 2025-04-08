#!/bin/bash
# Test the GitHub API server with real requests

# Colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color


# Define server URL
SERVER_URL="http://localhost:8001/github-api"

echo -e "${YELLOW}GitHub API Edge Function - API Tester${NC}"
echo -e "Testing server at: ${BLUE}$SERVER_URL${NC}\n"

# Function to make a request and display the result
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -e "${YELLOW}Testing: ${BLUE}$description${NC}"
  echo -e "Request: ${method} ${endpoint}"
  
  if [ -n "$data" ]; then
    echo -e "Data: $data"
    RESPONSE=$(curl -s -X "${method}" "${SERVER_URL}${endpoint}" \
      -H "Content-Type: application/json" \
      -d "${data}")
  else
    RESPONSE=$(curl -s -X "${method}" "${SERVER_URL}${endpoint}")
  fi
  
  # Check if response is valid JSON
  if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
    echo -e "${GREEN}Response (JSON):${NC}"
    echo "$RESPONSE" | jq .
  else
    echo -e "${GREEN}Response (Raw):${NC}"
    echo "$RESPONSE"
  fi
  
  echo -e "${YELLOW}----------------------------------------${NC}\n"
}

# Test 1: Get organization repositories
make_request "GET" "/" "" "List organization repositories"

# Test 2: GraphQL query for projects
make_request "POST" "/graphql" '{
  "query": "query { organization(login: \"agenticsorg\") { projectsV2(first: 10) { nodes { id title number url } } } }"
}' "GraphQL query for projects"

# Test 3: Get a specific repository README
make_request "GET" "/readme/edge-agents" "" "Get README for edge-agents repository"

# Test 4: Test CORS preflight
echo -e "${YELLOW}Testing: ${BLUE}CORS preflight request${NC}"
echo -e "Request: OPTIONS /graphql"
RESPONSE=$(curl -s -I -X "OPTIONS" "${SERVER_URL}/graphql")
echo -e "${GREEN}Response Headers:${NC}"
echo "$RESPONSE"
echo -e "${YELLOW}----------------------------------------${NC}\n"

echo -e "${GREEN}API tests completed${NC}"