#!/bin/bash
# Test runner script for GitHub API integration tests

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Running GitHub API Integration Tests${NC}"
echo "========================================"

# Function to run tests and report results
run_test() {
  local test_file=$1
  local test_name=$2
  
  echo -e "\n${YELLOW}Running $test_name tests...${NC}"
  
  if deno test --allow-net --allow-env $test_file; then
    echo -e "${GREEN}✓ $test_name tests passed${NC}"
    return 0
  else
    echo -e "${RED}✗ $test_name tests failed${NC}"
    return 1
  fi
}

# Create an array to track failures
failures=()

# Run unit tests
run_test "tests/unit/graphql.test.ts" "GraphQL Service" || failures+=("GraphQL Service")
run_test "tests/unit/error-handler.test.ts" "Error Handler" || failures+=("Error Handler")
run_test "tests/unit/env-validator.test.ts" "Environment Validator" || failures+=("Environment Validator")
run_test "tests/unit/response-formatter.test.ts" "Response Formatter" || failures+=("Response Formatter")

# Run integration tests
run_test "tests/integration/projects.test.ts" "Projects API" || failures+=("Projects API")
run_test "tests/integration/graphql-endpoint.test.ts" "GraphQL Endpoint" || failures+=("GraphQL Endpoint")

# Report summary
echo -e "\n${YELLOW}Test Summary${NC}"
echo "========================================"

if [ ${#failures[@]} -eq 0 ]; then
  echo -e "${GREEN}All tests passed successfully!${NC}"
  exit 0
else
  echo -e "${RED}The following tests failed:${NC}"
  for failure in "${failures[@]}"; do
    echo -e "  - ${RED}$failure${NC}"
  done
  exit 1
fi