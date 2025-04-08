#!/bin/bash

# Source environment variables from root .env
source "/workspaces/edge-agents/.env"

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Error: Required environment variables VITE_SUPABASE_PROJECT_ID and SUPABASE_PERSONAL_ACCESS_TOKEN must be set"
  exit 1
fi

# Run list functions
echo "Listing all functions..."
./scripts/supabase/functions/run-list-functions.sh

# Get function details
if [ ! -z "$1" ]; then
  echo -e "\nGetting details for function: $1"
  ./scripts/supabase/functions/get-function.sh "$1"
fi

# Deploy function if specified
if [ ! -z "$2" ] && [ "$2" = "deploy" ]; then
  echo -e "\nDeploying function: $1"
  ./scripts/supabase/functions/run-deploy-function.sh "$1"
fi