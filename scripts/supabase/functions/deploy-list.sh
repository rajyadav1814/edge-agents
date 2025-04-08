#!/bin/bash

# Load environment variables from root .env file
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Required environment variables
if [ -z "$VITE_SUPABASE_PROJECT_ID" ]; then
  echo "Error: VITE_SUPABASE_PROJECT_ID environment variable is required"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_KEY" ]; then
  echo "Error: SUPABASE_SERVICE_KEY environment variable is required"
  exit 1
fi

# API endpoint
API_URL="https://api.supabase.com/v1/projects/${VITE_SUPABASE_PROJECT_ID}/functions"

# List all Edge Functions
echo "Fetching Edge Functions list..."
curl --silent --location "${API_URL}" \
  --header "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  --header "Content-Type: application/json" | jq '.'

# Count total functions
TOTAL=$(curl --silent --location "${API_URL}" \
  --header "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  --header "Content-Type: application/json" | jq '. | length')

echo -e "\nTotal Edge Functions: ${TOTAL}"