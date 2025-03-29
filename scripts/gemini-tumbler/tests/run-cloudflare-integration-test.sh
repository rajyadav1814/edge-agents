#!/bin/bash
# Script to run the Cloudflare integration test

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check if environment variables are set
if [ -z "$CLOUDFLARE_WORKER_URL" ]; then
    echo "Warning: CLOUDFLARE_WORKER_URL is not set. Using default localhost URL."
    export CLOUDFLARE_WORKER_URL="http://localhost:8787"
fi

if [ -z "$FIRST_SERVICE_URL" ]; then
    echo "Warning: FIRST_SERVICE_URL is not set. Using default localhost URL."
    export FIRST_SERVICE_URL="http://localhost:8000/anonymizer"
fi

if [ -z "$FINAL_SERVICE_URL" ]; then
    echo "Warning: FINAL_SERVICE_URL is not set. Using default localhost URL."
    export FINAL_SERVICE_URL="http://localhost:8001/finalizer"
fi

if [ -z "$TEST_AUTH_TOKEN" ]; then
    echo "Warning: TEST_AUTH_TOKEN is not set. Using default test token."
    export TEST_AUTH_TOKEN="test-token"
fi

# Run the integration test
echo "Running Cloudflare integration test..."
deno test --allow-net --allow-env --allow-run cloudflare-integration-test.ts

echo "Integration test completed!"