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

# Use the API key from the environment
MODEL_ID="gemini-2.5-pro-exp-03-25"
GENERATE_CONTENT_API="generateContent"  # Using generateContent instead of streamGenerateContent

echo "Testing Gemini 2.5 Pro Experimental model with generateContent..."
echo "API Key: ${GEMINI_API_KEY:0:5}..."
echo "Model: ${MODEL_ID}"

# Create a temporary file for the request
REQUEST_FILE="${SCRIPT_DIR}/request.json"

cat << EOF > "${REQUEST_FILE}"
{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "What are the main differences between Gemini and GPT models? Please provide a short answer."
          }
        ]
      }
    ],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 500
    }
}
EOF

echo "Sending request to Gemini API..."
curl \
-X POST \
-H "Content-Type: application/json" \
"https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:${GENERATE_CONTENT_API}?key=${GEMINI_API_KEY}" -d "@${REQUEST_FILE}"

echo ""
echo "Test completed."

# Clean up
rm "${REQUEST_FILE}"