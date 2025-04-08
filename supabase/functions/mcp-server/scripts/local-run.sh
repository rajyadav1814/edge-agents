#!/bin/bash
# MCP Server Local Run Script
# This script runs the MCP server locally for testing

set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Navigate to the project root
cd "$(dirname "$0")/../../.."

# Check if .env file exists
if [ -f .env ]; then
  echo -e "${BLUE}Loading environment variables from .env${NC}"
  source .env
elif [ -f test/.env.test ]; then
  echo -e "${BLUE}Loading environment variables from test/.env.test${NC}"
  source test/.env.test
else
  echo -e "${YELLOW}Warning: No .env or test/.env.test file found${NC}"
  echo -e "${YELLOW}Using default test values${NC}"
fi

# Generate a random MCP secret key if not provided
if [ -z "$MCP_SECRET_KEY" ]; then
  MCP_SECRET_KEY=$(openssl rand -hex 32)
  echo -e "${YELLOW}Generated MCP_SECRET_KEY: ${MCP_SECRET_KEY}${NC}"
  export MCP_SECRET_KEY
fi

# Set default Supabase values if not provided
if [ -z "$SUPABASE_URL" ]; then
  SUPABASE_URL="http://localhost:54321"
  echo -e "${YELLOW}Using default SUPABASE_URL: ${SUPABASE_URL}${NC}"
  export SUPABASE_URL
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
  echo -e "${YELLOW}Using default SUPABASE_SERVICE_ROLE_KEY for local development${NC}"
  export SUPABASE_SERVICE_ROLE_KEY
fi

if [ -z "$SUPABASE_PROJECT_ID" ]; then
  SUPABASE_PROJECT_ID="local"
  echo -e "${YELLOW}Using default SUPABASE_PROJECT_ID: ${SUPABASE_PROJECT_ID}${NC}"
  export SUPABASE_PROJECT_ID
fi

# Function to run the MCP server
run_server() {
  echo -e "${BLUE}Starting MCP server locally...${NC}"
  
  # Navigate to the MCP server directory
  cd supabase/functions/mcp-server
  
  # Run the server using Deno
  echo -e "${GREEN}MCP server running at http://localhost:8000${NC}"
  echo -e "${GREEN}Press Ctrl+C to stop${NC}"
  
  deno run --allow-net --allow-env --allow-read core/server.ts
}

# Function to test the MCP server
test_server() {
  echo -e "${BLUE}Testing MCP server...${NC}"
  
  # Run the test script
  bash supabase/functions/mcp-server/scripts/test.sh
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
  else
    echo -e "${RED}Some tests failed. Please fix the issues before running the server.${NC}"
    exit 1
  fi
}

# Main script
case "$1" in
  "test")
    test_server
    ;;
  "run")
    run_server
    ;;
  *)
    echo -e "${BLUE}MCP Server Local Run Script${NC}"
    echo -e "${YELLOW}Usage:${NC}"
    echo "  $0 [command]"
    echo ""
    echo "Commands:"
    echo "  test      - Run tests only"
    echo "  run       - Run the server only"
    echo "  (no args) - Run tests and then start the server"
    echo ""
    
    # Run tests and then start the server if no arguments provided
    if [ -z "$1" ]; then
      test_server
      run_server
    fi
    ;;
esac