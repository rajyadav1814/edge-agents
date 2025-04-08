#!/bin/bash

# This script runs the Edge Deployment function locally

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Edge Deployment function locally...${NC}"

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
  echo -e "${RED}Error: Deno is not installed. Please install Deno first.${NC}"
  echo "Visit https://deno.land/#installation for installation instructions."
  exit 1
fi

# Navigate to the function directory
cd "$(dirname "$0")"

# Extract environment variables from .env file
export SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')
export VITE_SUPABASE_PROJECT_ID=$(grep VITE_SUPABASE_PROJECT_ID /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')
export SUPABASE_URL=$(grep SUPABASE_URL /workspaces/agentics/.env | grep -v VITE | head -n 1 | cut -d '=' -f2 | tr -d ' \t\r\n')
export SUPABASE_SERVICE_KEY=$(grep SUPABASE_SERVICE_KEY /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')

# If SUPABASE_SERVICE_KEY is not set, use VITE_SUPABASE_SERVICE_ROLE_KEY
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  export SUPABASE_SERVICE_KEY=$(grep VITE_SUPABASE_SERVICE_ROLE_KEY /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')
fi

# Verify environment variables are set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ] || [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo -e "${RED}Error: Required environment variables are not set in the .env file.${NC}"
  echo "Please make sure the following variables are defined in /workspaces/agentics/.env:"
  echo "  - VITE_SUPABASE_PROJECT_ID"
  echo "  - SUPABASE_URL"
  echo "  - SUPABASE_ACCESS_TOKEN"
  echo "  - SUPABASE_SERVICE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

echo -e "${YELLOW}Using Project ID: $VITE_SUPABASE_PROJECT_ID${NC}"
echo -e "${YELLOW}Using Access Token: ${SUPABASE_ACCESS_TOKEN:0:10}...${NC}"
echo -e "${YELLOW}Using Service Key: ${SUPABASE_SERVICE_KEY:0:10}...${NC}"

# Run the function
echo -e "${GREEN}Running Edge Deployment function...${NC}"
echo -e "${YELLOW}The function will be available at http://localhost:54321/functions/v1/edge_deployment${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop the function.${NC}"
echo ""

deno run --allow-net --allow-env --allow-read src/index.ts
