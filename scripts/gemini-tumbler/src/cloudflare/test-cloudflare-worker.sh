#!/bin/bash
# Script to test the Cloudflare Worker

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check if deno is installed
if ! command -v deno &> /dev/null; then
    echo "Deno not found. Please install Deno first."
    exit 1
fi

# Run the tests
echo "Running Cloudflare Worker tests..."
deno test --allow-net --allow-env --no-check cloudflare-worker.test.ts

echo "Tests completed!"