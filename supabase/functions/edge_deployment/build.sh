#!/bin/bash

# Build script for the Edge Deployment function
# This script bundles the Edge Function for deployment

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Building Edge Deployment function...${NC}"

# Check if Deno is installed
if ! command -v deno &> /dev/null; then
  echo -e "${RED}Error: Deno is not installed. Please install Deno first.${NC}"
  echo "Visit https://deno.land/#installation for installation instructions."
  exit 1
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo -e "${YELLOW}Warning: Supabase CLI is not installed. You will not be able to deploy the function.${NC}"
  echo "Visit https://supabase.com/docs/guides/cli for installation instructions."
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

# Note about Deno 2 compatibility
echo -e "${YELLOW}Note: The 'deno bundle' command was removed in Deno 2.${NC}"
echo -e "${YELLOW}Using alternative approach for building...${NC}"

# Create a simple index.ts file that imports and re-exports the main module
echo -e "${GREEN}Creating index.ts file...${NC}"
echo 'export * from "./src/index.ts";' > index.ts

if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Failed to create index.ts file.${NC}"
  exit 1
fi

echo -e "${GREEN}Build completed successfully!${NC}"
echo -e "${YELLOW}The function has been prepared for deployment.${NC}"

# Check if the user wants to deploy the function
if [ "$1" == "--deploy" ]; then
  echo -e "${YELLOW}Deploying the function...${NC}"
  
  # Use Supabase CLI to deploy the function
  supabase functions deploy edge_deployment
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to deploy the function.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Deployment completed successfully!${NC}"
else
  echo -e "${YELLOW}To deploy the function, run:${NC}"
  echo -e "  ${GREEN}supabase functions deploy edge_deployment${NC}"
  echo -e "  ${GREEN}or${NC}"
  echo -e "  ${GREEN}./build.sh --deploy${NC}"
fi

echo -e "${GREEN}Done!${NC}"
