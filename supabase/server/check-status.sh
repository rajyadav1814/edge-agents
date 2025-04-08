#!/bin/bash

# Script to check if all Supabase services are running correctly
# Usage: ./check-status.sh

set -e

echo "=== Supabase Status Check ==="
echo "Checking if all services are running..."

# Determine the script's directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "Working directory: $(pwd)"

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "Error: .env file not found in $(pwd)"
    echo "Please run this script from the supabase/server directory or create a .env file"
    exit 1
fi

# Load environment variables
echo "Loading environment variables from .env file..."
export $(grep -v '^#' .env | xargs)

# Check if all services are running
echo -e "\n=== Docker Compose Services Status ==="
docker-compose ps

# Check if all services are healthy
echo -e "\n=== Health Check ==="
SERVICES=("postgres" "supabase-kong" "supabase-auth" "supabase-rest" "supabase-realtime" "supabase-storage" "supabase-edge-functions" "supabase-studio")

for SERVICE in "${SERVICES[@]}"; do
    STATUS=$(docker-compose ps --format json $SERVICE | grep -o '"State":"[^"]*"' | cut -d'"' -f4)
    if [ "$STATUS" == "running" ]; then
        echo "✅ $SERVICE is running"
    else
        echo "❌ $SERVICE is not running (status: $STATUS)"
    fi
done

# Check if PostgreSQL is accepting connections
echo -e "\n=== PostgreSQL Connection Test ==="
if docker-compose exec -T postgres pg_isready -U postgres; then
    echo "✅ PostgreSQL is accepting connections"
else
    echo "❌ PostgreSQL is not accepting connections"
fi

# Check if Kong API Gateway is accessible
echo -e "\n=== Kong API Gateway Test ==="
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000 | grep -q "200\|404"; then
    echo "✅ Kong API Gateway is accessible"
else
    echo "❌ Kong API Gateway is not accessible"
fi

# Check if Supabase Studio is accessible
echo -e "\n=== Supabase Studio Test ==="
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    echo "✅ Supabase Studio is accessible"
else
    echo "❌ Supabase Studio is not accessible"
fi

# Check if Edge Functions service is accessible
echo -e "\n=== Edge Functions Test ==="
if curl -s -o /dev/null -w "%{http_code}" http://localhost:9000 | grep -q "200\|404"; then
    echo "✅ Edge Functions service is accessible"
else
    echo "❌ Edge Functions service is not accessible"
fi

# Test the hello-world edge function
echo -e "\n=== Hello World Function Test ==="
RESPONSE=$(curl -s -X POST http://localhost:9000/functions/v1/hello-world -H "Content-Type: application/json" -d '{"name":"Supabase"}')
if echo "$RESPONSE" | grep -q "Hello, Supabase"; then
    echo "✅ Hello World function is working"
    echo "Response: $RESPONSE"
else
    echo "❌ Hello World function is not working"
    echo "Response: $RESPONSE"
fi

# Check logs for any errors
echo -e "\n=== Recent Error Logs ==="
docker-compose logs --tail=20 | grep -i "error\|fail\|exception" || echo "No recent errors found"

echo -e "\n=== Summary ==="
echo "All checks completed. If all checks passed, your Supabase instance is running correctly."
echo "You can access:"
echo "- Supabase Studio: http://localhost:3000"
echo "- Supabase API: http://localhost:8000"
echo "- Edge Functions: http://localhost:9000"
