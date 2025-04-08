#!/bin/bash
# Run the OpenAI-compatible server example

# Change to the gemini-tumbler directory to use the .env file
cd "$(dirname "$0")/.."
SCRIPT_DIR="$(pwd)"
EXAMPLES_DIR="$SCRIPT_DIR/examples"

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "Error: .env file not found in $SCRIPT_DIR"
  echo "Please create a .env file with your GEMINI_API_KEY"
  exit 1
fi

# Set execution permissions
chmod +x "$EXAMPLES_DIR/run-openai-compatible-server.sh"

# Run the server with environment variables from .env
echo "Starting OpenAI-compatible server..."
echo "Using .env file from: $SCRIPT_DIR/.env"
cd "$EXAMPLES_DIR"
deno run --allow-net --allow-env --allow-read="$SCRIPT_DIR/.env" openai-compatible-streaming.ts