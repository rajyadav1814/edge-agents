#!/bin/bash

# Run the env_test.ts script with the agentic.env file
echo "Running env_test.ts with agentic.env..."
deno run --env-file=/workspaces/agentics/agentic.env --allow-env --allow-read /workspaces/agentics/supabase/functions/env_test.ts