#!/bin/bash

# Colors for console output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Running MCP Server Tests...${NC}"

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Run the test script
deno run --allow-net --allow-env --allow-read "$SCRIPT_DIR/test.ts"
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo -e "${RED}Tests failed with exit code $TEST_EXIT_CODE${NC}"
  exit $TEST_EXIT_CODE
fi

echo -e "${GREEN}All tests passed!${NC}"
echo ""

# Check if we should run the deployment script
if [ "$1" == "--deploy" ]; then
  echo -e "${BLUE}Running MCP Server Deployment...${NC}"
  echo -e "${YELLOW}Note: This will fail if environment variables are not set.${NC}"
  echo -e "${YELLOW}Required variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_PROJECT_ID${NC}"
  
  # Run the deployment script
  deno run --allow-net --allow-env --allow-read "$SCRIPT_DIR/deploy.ts"
  DEPLOY_EXIT_CODE=$?
  
  if [ $DEPLOY_EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}Deployment script exited with code $DEPLOY_EXIT_CODE${NC}"
    echo -e "${YELLOW}This is expected if environment variables are not set.${NC}"
  else
    echo -e "${GREEN}Deployment completed successfully!${NC}"
  fi
else
  echo -e "${BLUE}Skipping deployment. Use --deploy flag to run deployment script.${NC}"
fi

echo ""
echo -e "${GREEN}MCP Server testing completed!${NC}"