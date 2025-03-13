#!/bin/bash

# Script to restart Supabase services
# Usage: ./restart.sh

set -e

echo "=== Supabase Restart ==="

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

echo -e "\n=== Stopping Supabase Services ==="
docker-compose down

echo -e "\n=== Starting Supabase Services ==="
docker-compose up -d

echo -e "\n=== Checking Service Status ==="
docker-compose ps

echo -e "\n=== Waiting for Services to Initialize (30 seconds) ==="
sleep 30

echo -e "\n=== Running Status Check ==="
./check-status.sh

echo -e "\n=== Restart Complete ==="
echo "If you still see services restarting, run ./check-logs.sh to diagnose the issues"
echo "You can access:"
echo "- Supabase Studio: http://localhost:3000"
echo "- Supabase API: http://localhost:8000"
echo "- Edge Functions: http://localhost:9000"
