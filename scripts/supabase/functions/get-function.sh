#!/bin/bash

# Source environment variables from root .env
source "/workspaces/edge-agents/.env"

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Error: Required environment variables VITE_SUPABASE_PROJECT_ID and SUPABASE_PERSONAL_ACCESS_TOKEN must be set"
  exit 1
fi

# Check if function name argument is provided
if [ -z "$1" ]; then
  echo "Error: Function name argument required"
  echo "Usage: $0 <function-name>"
  exit 1
fi

FUNCTION_NAME="$1"

# Make request to get specific function
curl --silent --location \
  "https://api.supabase.com/v1/projects/${VITE_SUPABASE_PROJECT_ID}/functions/${FUNCTION_NAME}" \
  --header "Authorization: Bearer ${SUPABASE_PERSONAL_ACCESS_TOKEN}" \
  --header "Content-Type: application/json" | jq '.'