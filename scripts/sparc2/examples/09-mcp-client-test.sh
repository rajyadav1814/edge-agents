#!/bin/bash
# Example 9: Testing the MCP Server
# This example demonstrates how to interact with the MCP server using curl

# Set the current directory to the script directory
cd "$(dirname "$0")"
SCRIPT_DIR="$(pwd)"

# Define colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define the MCP server URL
MCP_SERVER="http://localhost:3001"

# Function to make API calls to the MCP server
call_mcp() {
  local endpoint=$1
  local data=$2
  local method=${3:-POST}

  echo -e "${BLUE}Making $method request to $endpoint${NC}"
  echo -e "${BLUE}Request data:${NC} $data"
  echo

  # Make the API call
  response=$(curl -s -X $method "$MCP_SERVER/$endpoint" \
    -H "Content-Type: application/json" \
    -d "$data")

  echo -e "${GREEN}Response:${NC}"
  echo "$response" | jq '.' || echo "$response"
  echo
  echo -e "${GREEN}----------------------------------------${NC}"
  echo
}

# Check if the MCP server is running
echo -e "${BLUE}Checking if MCP server is running...${NC}"
if ! curl -s "$MCP_SERVER/ping" > /dev/null; then
  echo -e "${RED}MCP server is not running. Please start it first with:${NC}"
  echo -e "${RED}cd .. && ./sparc mcp${NC}"
  exit 1
fi

echo -e "${GREEN}MCP server is running!${NC}"
echo

# Test 1: List available tools
echo -e "${BLUE}Test 1: Listing available tools${NC}"
curl -s "$MCP_SERVER/list_tools" | jq '.'
echo
echo -e "${GREEN}----------------------------------------${NC}"
echo

# Test 2: Execute code (simpler test that doesn't require file access)
echo -e "${BLUE}Test 2: Executing simple JavaScript code${NC}"
call_mcp "execute" '{
  "code": "console.log(\"Hello from MCP!\"); const sum = (a, b) => a + b; console.log(`Sum of 5 and 3 is ${sum(5, 3)}`);",
  "language": "javascript"
}'

# Test 3: Create a simple file for testing
echo -e "${BLUE}Test 3: Creating a test file${NC}"
TEST_FILE="$SCRIPT_DIR/test_mcp_example.js"
cat > "$TEST_FILE" << 'EOF'
// Simple test file for MCP server
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

console.log("Test file loaded");
EOF

echo -e "${GREEN}Created test file: $TEST_FILE${NC}"
echo

# Test 4: Analyze the test file
echo -e "${BLUE}Test 4: Analyzing the test file${NC}"
call_mcp "analyze" "{
  \"files\": [\"$TEST_FILE\"],
  \"task\": \"Find bugs\"
}"

# Test 5: Modify the test file
echo -e "${BLUE}Test 5: Modifying the test file${NC}"
call_mcp "modify" "{
  \"files\": [\"$TEST_FILE\"],
  \"task\": \"Add multiply function\"
}"

# Test 6: Execute the test file (if previous tests succeeded)
echo -e "${BLUE}Test 6: Executing the test file${NC}"
TEST_FILE_CONTENT=$(cat "$TEST_FILE")
call_mcp "execute" "{
  \"code\": $(echo "$TEST_FILE_CONTENT" | jq -Rs .),
  \"language\": \"javascript\"
}"

echo -e "${GREEN}All tests completed!${NC}"
echo -e "${BLUE}The MCP server is still running. You can continue to interact with it.${NC}"
echo -e "${BLUE}Press Ctrl+C in the server terminal to stop it.${NC}"