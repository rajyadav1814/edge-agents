#!/bin/bash

echo "Testing GitHub Projects MCP Discovery Endpoint"

# Set the MCP discovery server URL
MCP_URL="http://localhost:8002"

# Function to make a request and display the response
test_endpoint() {
  local endpoint=$1
  local description=$2
  
  echo "Testing $description at $endpoint..."
  
  # Make the request and capture the response
  response=$(curl -s "$endpoint")
  
  # Check if the request was successful
  if [ $? -eq 0 ]; then
    echo "✅ Request successful!"
    echo "Response:"
    echo "$response" | jq . 2>/dev/null || echo "$response"
    echo ""
  else
    echo "❌ Request failed!"
    echo ""
  fi
}

# Test the main MCP discovery endpoint
test_endpoint "$MCP_URL" "MCP Discovery Endpoint"

# Test the events endpoint (SSE)
echo "Testing SSE Events Endpoint at $MCP_URL/events..."
echo "This will connect to the SSE stream for 5 seconds..."

# Use curl to connect to the SSE stream for 5 seconds
timeout 5 curl -N -H "Accept: text/event-stream" "$MCP_URL/events"
echo -e "\n✅ SSE connection test completed"

echo "MCP Discovery Tests Completed"