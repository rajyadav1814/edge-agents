#!/bin/bash

# This script lists all Edge Functions deployed to Supabase

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Listing Supabase Edge Functions...${NC}"

# Extract environment variables from .env file
export SUPABASE_ACCESS_TOKEN=$(grep SUPABASE_ACCESS_TOKEN /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')
export VITE_SUPABASE_PROJECT_ID=$(grep VITE_SUPABASE_PROJECT_ID /workspaces/agentics/.env | cut -d '=' -f2 | tr -d ' \t\r\n')

# Verify environment variables are set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo -e "${RED}Error: Required environment variables are not set in the .env file.${NC}"
  echo "Please make sure the following variables are defined in /workspaces/agentics/.env:"
  echo "  - VITE_SUPABASE_PROJECT_ID"
  echo "  - SUPABASE_ACCESS_TOKEN"
  exit 1
fi

echo -e "${YELLOW}Using Project ID: $VITE_SUPABASE_PROJECT_ID${NC}"
echo -e "${YELLOW}Using Access Token: ${SUPABASE_ACCESS_TOKEN:0:10}...${NC}"

# Make the API request to list functions
echo -e "${GREEN}Making API request to list functions...${NC}"

# Use curl to make the API request
curl -s -X GET \
  "https://api.supabase.com/v1/projects/$VITE_SUPABASE_PROJECT_ID/functions" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq

echo -e "${GREEN}Done!${NC}"
