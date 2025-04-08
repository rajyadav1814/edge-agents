#!/bin/bash

echo "Testing SSE endpoint with curl..."
echo "This will show the raw response headers and content"

# Use curl with verbose mode to see headers
curl -v -N -H "Accept: text/event-stream" http://localhost:8002/events

echo ""
echo "Testing complete"