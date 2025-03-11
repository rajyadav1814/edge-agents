#!/bin/bash

# Source environment variables from root .env
source "/workspaces/edge-agents/.env"

# Check if required environment variables are set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ] || [ -z "$SUPABASE_PERSONAL_ACCESS_TOKEN" ]; then
  echo "Error: Required environment variables VITE_SUPABASE_PROJECT_ID and SUPABASE_PERSONAL_ACCESS_TOKEN must be set"
  exit 1
fi

# Run the Edge Function locally
cd /workspaces/edge-agents && deno run \
  --allow-net \
  --allow-env \
  --allow-read \
  --env-file=.env \
  supabase/functions/list-functions/index.ts