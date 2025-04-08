#!/bin/bash
# Test the OpenAI-compatible endpoints

# Default values
PORT=3000
HOST="localhost"
MODEL="gpt-3.5-turbo"
STREAM=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --host=*)
      HOST="${1#*=}"
      shift
      ;;
    --model=*)
      MODEL="${1#*=}"
      shift
      ;;
    --stream)
      STREAM=true
      shift
      ;;
    --help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --port=PORT      Server port (default: 3000)"
      echo "  --host=HOST      Server host (default: localhost)"
      echo "  --model=MODEL    Model to use (default: gpt-3.5-turbo)"
      echo "  --stream         Enable streaming mode"
      echo "  --help           Show this help message"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Set execution permissions
chmod +x test-openai-compatibility.sh

# Create a temporary request file
cat << EOF > /tmp/openai_request.json
{
  "model": "$MODEL",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant that provides concise responses."},
    {"role": "user", "content": "What are the main differences between REST and GraphQL?"}
  ],
  "temperature": 0.7,
  "max_tokens": 500,
  "stream": $STREAM
}
EOF

echo "Testing OpenAI-compatible /chat/completions endpoint..."
echo "Host: $HOST:$PORT"
echo "Model: $MODEL"
echo "Streaming: $STREAM"
echo ""

if [ "$STREAM" = true ]; then
  # Streaming request
  echo "Sending streaming request..."
  curl -X POST \
    -H "Content-Type: application/json" \
    "http://$HOST:$PORT/chat/completions" \
    -d @/tmp/openai_request.json
else
  # Regular request
  echo "Sending regular request..."
  curl -X POST \
    -H "Content-Type: application/json" \
    "http://$HOST:$PORT/chat/completions" \
    -d @/tmp/openai_request.json | jq .
fi

# Clean up
rm /tmp/openai_request.json