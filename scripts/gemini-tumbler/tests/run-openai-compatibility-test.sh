#!/bin/bash
# Run the OpenAI compatibility test

# Change to the gemini-tumbler directory to use the .env file
cd "$(dirname "$0")/.."
SCRIPT_DIR="$(pwd)"
TESTS_DIR="$SCRIPT_DIR/tests"

# Check if .env file exists
if [ ! -f "$SCRIPT_DIR/.env" ]; then
  echo "Error: .env file not found in $SCRIPT_DIR"
  echo "Please create a .env file with your GEMINI_API_KEY"
  exit 1
fi

# Set execution permissions
chmod +x "$TESTS_DIR/run-openai-compatibility-test.sh"

# Parse command line arguments
SERVER_URL="http://localhost:3000"

while [[ "$#" -gt 0 ]]; do
  case $1 in
    --url|--server-url) SERVER_URL="$2"; shift ;;
    *) echo "Unknown parameter: $1"; exit 1 ;;
  esac
  shift
done

# Run the test with environment variables from .env
echo "Running OpenAI compatibility test..."
echo "Using .env file from: $SCRIPT_DIR/.env"
echo "Server URL: $SERVER_URL"

cd "$TESTS_DIR"
SERVER_URL="$SERVER_URL" deno run --allow-net --allow-env --allow-read="$SCRIPT_DIR/.env" openai-compatibility-test.ts