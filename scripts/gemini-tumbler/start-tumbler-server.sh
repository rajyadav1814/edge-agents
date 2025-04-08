#!/bin/bash
set -e -E

# Get the directory of the script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Load environment variables from .env file, trying multiple locations
if [ -f "${SCRIPT_DIR}/.env" ]; then
  source "${SCRIPT_DIR}/.env"
  echo "Loaded .env from ${SCRIPT_DIR}/.env"
elif [ -f "${SCRIPT_DIR}/../.env" ]; then
  source "${SCRIPT_DIR}/../.env"
  echo "Loaded .env from ${SCRIPT_DIR}/../.env"
elif [ -f "$(pwd)/.env" ]; then
  source "$(pwd)/.env"
  echo "Loaded .env from $(pwd)/.env"
elif [ -f "$(pwd)/scripts/gemini-tumbler/.env" ]; then
  source "$(pwd)/scripts/gemini-tumbler/.env"
  echo "Loaded .env from $(pwd)/scripts/gemini-tumbler/.env"
else
  echo "Error: .env file not found in any of the expected locations"
  exit 1
fi

# Check if API key is set
if [ -z "${GEMINI_API_KEY}" ]; then
  echo "Error: GEMINI_API_KEY environment variable is not set"
  echo "Please set it in the .env file or as an environment variable"
  exit 1
fi

# Set the port for the server
PORT=${PORT:-3000}

echo "Starting Gemini Tumbler server on port ${PORT}..."
echo "Using Gemini API Key: ${GEMINI_API_KEY:0:5}..."

# Change to the gemini-tumbler directory
cd "${SCRIPT_DIR}"

# Create contributions directory if it doesn't exist
mkdir -p "${SCRIPT_DIR}/contributions"

# Start the server using Deno with all necessary permissions
deno run --allow-net --allow-env --allow-read --allow-write=./contributions src/index.ts