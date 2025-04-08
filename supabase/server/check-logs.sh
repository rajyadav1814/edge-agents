#!/bin/bash

# Script to check logs for Supabase services that are having issues
# Usage: ./check-logs.sh

set -e

echo "=== Supabase Logs Check ==="

# Determine the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Working directory: $(pwd)"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found in $(pwd)"
    echo "Please run this script from the supabase/server directory or create a .env file"
    exit 1
fi

# Load environment variables
echo "Loading environment variables from .env file..."
export $(grep -v '^#' .env | xargs)

# Services that were restarting
SERVICES=("supabase-auth" "supabase-realtime" "supabase-storage" "supabase-edge-functions")

for SERVICE in "${SERVICES[@]}"; do
    echo -e "\n=== Logs for $SERVICE ==="
    docker-compose logs --tail=50 $SERVICE
done

echo -e "\n=== Checking for JWT Secret Issues ==="
if [ -z "$SUPABASE_JWT_SECRET" ]; then
    echo "❌ SUPABASE_JWT_SECRET is empty in .env file"
    echo "This is likely causing the services to restart"
    echo "Please set a valid JWT secret in the .env file (at least 32 characters)"
else
    JWT_LENGTH=${#SUPABASE_JWT_SECRET}
    if [ $JWT_LENGTH -lt 32 ]; then
        echo "❌ SUPABASE_JWT_SECRET is too short ($JWT_LENGTH characters)"
        echo "It should be at least 32 characters long"
    else
        echo "✅ SUPABASE_JWT_SECRET length is sufficient ($JWT_LENGTH characters)"
    fi
fi

echo -e "\n=== Checking for API Key Issues ==="
if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "❌ SUPABASE_ANON_KEY is empty in .env file"
else
    echo "✅ SUPABASE_ANON_KEY is set"
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY is empty in .env file"
else
    echo "✅ SUPABASE_SERVICE_ROLE_KEY is set"
fi

echo -e "\n=== Recommendations ==="
echo "1. Check the logs above for specific error messages"
echo "2. Ensure SUPABASE_JWT_SECRET is at least 32 characters long"
echo "3. Make sure SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are valid JWT tokens"
echo "4. Try restarting the services with: docker-compose restart"
echo "5. If issues persist, try rebuilding with: docker-compose down && docker-compose up -d"
