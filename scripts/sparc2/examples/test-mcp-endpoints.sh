#!/bin/bash
# Test script for SPARC2 MCP server endpoints
# This script demonstrates how to use curl to interact with the MCP server

# Default port
PORT=3001

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port|-p)
      PORT="$2"
      shift 2
      ;;
    --clean|-c)
      CLEAN_TAGS=true
      shift
      ;;
    *)
      echo "Unknown option: $1"
      echo "Usage: $0 [--port PORT] [--clean]"
      exit 1
      ;;
  esac
done

# Base URL for the MCP server
BASE_URL="http://localhost:$PORT"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
  echo -e "\n${BLUE}==== $1 ====${NC}\n"
}

# Function to execute a curl command and format the output
execute_curl() {
  echo -e "${GREEN}Command:${NC} $1"
  echo -e "${GREEN}Response:${NC}"
  eval $1
  echo -e "\n"
}

# Check if the MCP server is running
check_server() {
  if ! curl -s "$BASE_URL/discover" > /dev/null; then
    echo -e "${RED}Error: MCP server is not running on port $PORT${NC}"
    echo -e "Please start the server with: ./sparc mcp --port $PORT"
    exit 1
  fi
}

# Get the repository root directory
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$REPO_ROOT" ]; then
  echo -e "${RED}Warning: Not in a git repository. Using current directory for test files.${NC}"
  REPO_ROOT=$(pwd)
fi

# Generate a unique timestamp for this test run
TIMESTAMP=$(date +%s)

# Clean up existing tags if requested
if [ "$CLEAN_TAGS" = true ]; then
  print_header "Cleaning up existing Git tags"
  echo -e "${YELLOW}Removing pre-analyze tags...${NC}"
  git tag -l "pre-analyze-*" | xargs -r git tag -d
  echo -e "${YELLOW}Removing pre-modify tags...${NC}"
  git tag -l "pre-modify-*" | xargs -r git tag -d
  echo -e "${YELLOW}Done cleaning tags.${NC}"
fi

# Start by checking if the server is running
check_server

# Test 1: Discover endpoint
print_header "Testing /discover endpoint"
execute_curl "curl -s $BASE_URL/discover | jq"

# Test 2: Execute code endpoint
print_header "Testing /execute endpoint with JavaScript"
execute_curl "curl -s -X POST $BASE_URL/execute \
  -H \"Content-Type: application/json\" \
  -d '{\"code\": \"console.log(\\\"Hello, SPARC2!\\\"); const sum = (a, b) => a + b; console.log(sum(5, 3));\", \"language\": \"javascript\"}' | jq"

# Test 3: Execute code endpoint with Python
print_header "Testing /execute endpoint with Python"
execute_curl "curl -s -X POST $BASE_URL/execute \
  -H \"Content-Type: application/json\" \
  -d '{\"code\": \"print(\\\"Hello from Python!\\\")\\nprint(f\\\"Sum: {5 + 3}\\\")\", \"language\": \"python\"}' | jq"

# Test 4: Config endpoint (list)
print_header "Testing /config endpoint (list)"
execute_curl "curl -s -X POST $BASE_URL/config \
  -H \"Content-Type: application/json\" \
  -d '{\"action\": \"list\"}' | jq"

# Test 5: Search endpoint
print_header "Testing /search endpoint"
execute_curl "curl -s -X POST $BASE_URL/search \
  -H \"Content-Type: application/json\" \
  -d '{\"query\": \"code analysis\", \"limit\": 3}' | jq"

# Test 6: Create a temporary file for analyze and modify tests
print_header "Creating a temporary JavaScript file for testing"
TMP_FILE="$REPO_ROOT/scripts/sparc2/examples/temp_test_file_$TIMESTAMP.js"
cat > $TMP_FILE << 'EOF'
// Simple JavaScript function with a bug
function multiply(a, b) {
  return a + b; // Bug: should be a * b
}

// Test the function
console.log(multiply(5, 3)); // Expected: 15, Actual: 8
EOF

echo -e "${GREEN}Created test file:${NC} $TMP_FILE"
cat $TMP_FILE
echo -e "\n"

# Test 7: Analyze endpoint
print_header "Testing /analyze endpoint"
ANALYZE_TASK="Find and fix the bug in the multiply function (test $TIMESTAMP)"
execute_curl "curl -s -X POST $BASE_URL/analyze \
  -H \"Content-Type: application/json\" \
  -d '{\"files\": [\"$TMP_FILE\"], \"task\": \"$ANALYZE_TASK\"}' | jq"

# Test 8: Modify endpoint
print_header "Testing /modify endpoint"
MODIFY_TASK="Fix the bug in the multiply function by changing + to * (test $TIMESTAMP)"
execute_curl "curl -s -X POST $BASE_URL/modify \
  -H \"Content-Type: application/json\" \
  -d '{\"files\": [\"$TMP_FILE\"], \"task\": \"$MODIFY_TASK\"}' | jq"

# Show the modified file
print_header "Modified file content"
cat $TMP_FILE
echo -e "\n"

# Test 9: Checkpoint endpoint (if in a git repository)
if git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  print_header "Testing /checkpoint endpoint"
  CHECKPOINT_NAME="test-checkpoint-$TIMESTAMP"
  execute_curl "curl -s -X POST $BASE_URL/checkpoint \
    -H \"Content-Type: application/json\" \
    -d '{\"name\": \"$CHECKPOINT_NAME\"}' | jq"
else
  echo -e "${RED}Skipping checkpoint test - not in a git repository${NC}"
fi

# Clean up
print_header "Cleaning up"
rm -f $TMP_FILE
echo -e "${GREEN}Removed temporary file:${NC} $TMP_FILE"

print_header "All tests completed"
echo -e "The SPARC2 MCP server is running correctly on port $PORT"
echo -e "\nTo run this test with tag cleanup, use: ${GREEN}./scripts/sparc2/examples/test-mcp-endpoints.sh --clean${NC}"