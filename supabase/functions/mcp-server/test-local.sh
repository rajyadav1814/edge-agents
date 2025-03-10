#!/bin/bash
# MCP Server Local Test Script
# This script runs the MCP server locally for testing purposes.

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

# Run the tests
echo -e "${BLUE}Running MCP server tests...${NC}"
cd supabase/functions/mcp-server
deno test --allow-net --allow-env --allow-read

# Start the server locally
echo -e "${BLUE}Starting MCP server locally...${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the server${NC}"
deno run --allow-net --allow-env --allow-read index.ts