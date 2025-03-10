#!/bin/bash
# MCP Server Agent Local Test Script
# This script runs the MCP server agent tests locally.

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Navigate to the project root
cd "$(dirname "$0")/../.."

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Warning: .env file not found in project root.${NC}"
  echo -e "${YELLOW}Creating a minimal .env file with required variables.${NC}"
  
  # Create minimal .env file with dummy values for testing
  cat > .env << EOF
SUPABASE_URL=http://localhost:8000
SUPABASE_SERVICE_ROLE_KEY=dummy-service-role-key
SUPABASE_PROJECT_ID=dummy-project-id
MCP_SECRET_KEY=dummy-secret-key
EOF
  
  echo -e "${GREEN}Created .env file with dummy values for testing.${NC}"
fi

# Run the agent tests
echo -e "${BLUE}Running MCP server agent tests...${NC}"
cd supabase/functions/mcp-server
deno test --allow-net --allow-env --allow-read tests/agent-test.ts

# If tests pass, offer to start the server locally
if [ $? -eq 0 ]; then
  echo -e "${GREEN}All agent tests passed!${NC}"
  
  read -p "Do you want to start the MCP server locally? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Starting MCP server locally...${NC}"
    echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
    deno run --allow-net --allow-env --allow-read index.ts
  fi
else
  echo -e "${RED}Some tests failed. Please fix the issues before starting the server.${NC}"
  exit 1
fi