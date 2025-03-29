#!/bin/bash
# Script to deploy the Cloudflare Worker

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Set up secrets if provided
if [ -n "$ANONYMIZER_SALT" ]; then
    echo "Setting ANONYMIZER_SALT secret..."
    echo "$ANONYMIZER_SALT" | wrangler secret put ANONYMIZER_SALT
fi

if [ -n "$AUTH_SECRET" ]; then
    echo "Setting AUTH_SECRET secret..."
    echo "$AUTH_SECRET" | wrangler secret put AUTH_SECRET
fi

# Deploy the worker
echo "Deploying Cloudflare Worker..."
wrangler publish

echo "Deployment complete!"