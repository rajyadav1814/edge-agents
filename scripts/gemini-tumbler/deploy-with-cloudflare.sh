#!/bin/bash
# Script to deploy the entire system including Cloudflare Worker

# Ensure we're in the right directory
cd "$(dirname "$0")"

# Check if required environment variables are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: SUPABASE_URL and SUPABASE_ANON_KEY must be set."
    exit 1
fi

# Deploy Supabase Edge Functions
echo "Deploying Supabase Edge Functions..."
./deploy-anonymizer-chain.sh

# Check if the Supabase deployment was successful
if [ $? -ne 0 ]; then
    echo "Supabase deployment failed. Fixing issues before proceeding to Cloudflare deployment."
    exit 1
fi

# Deploy Cloudflare Worker
echo "Deploying Cloudflare Worker..."
cd src/cloudflare
./deploy-cloudflare-worker.sh

# Check if the Cloudflare deployment was successful
if [ $? -ne 0 ]; then
    echo "Cloudflare deployment failed."
    exit 1
fi

# Get the Cloudflare Worker URL
CLOUDFLARE_WORKER_URL=$(wrangler whoami | grep -o 'https://.*\.workers\.dev' || echo "")

if [ -z "$CLOUDFLARE_WORKER_URL" ]; then
    echo "Warning: Could not automatically determine Cloudflare Worker URL."
    echo "Please manually set the NEXT_FUNCTION_ENDPOINT in your Supabase Edge Function."
else
    echo "Cloudflare Worker deployed at: $CLOUDFLARE_WORKER_URL"
    
    # Update the Supabase Edge Function to point to the Cloudflare Worker
    echo "Updating Supabase Edge Function to use Cloudflare Worker..."
    # This would typically be done through the Supabase dashboard or API
    echo "Please set NEXT_FUNCTION_ENDPOINT to $CLOUDFLARE_WORKER_URL in your Supabase Edge Function."
fi

echo "Deployment completed!"
echo "To test the complete system, run: ./run-all-tests-with-cloudflare.sh"