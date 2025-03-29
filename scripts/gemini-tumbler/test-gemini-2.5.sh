#!/bin/bash
set -e -E

# Load environment variables from .env file
if [ -f ".env" ]; then
  source .env
elif [ -f "scripts/gemini-tumbler/.env" ]; then
  source scripts/gemini-tumbler/.env
else
  echo "Error: .env file not found"
  exit 1
fi

# Explicitly set the API key
GEMINI_API_KEY="AIzaSyBYabcyspDCajEgTvw3-rRy2HIS6pqsx-k"
MODEL_ID="gemini-2.5-pro-exp-03-25"
GENERATE_CONTENT_API="streamGenerateContent"

echo "Testing Gemini 2.5 Pro Experimental model..."
echo "API Key: ${GEMINI_API_KEY:0:5}..."
echo "Model: ${MODEL_ID}"

cat << EOF > request.json
{
    "contents": [
      {
        "role": "user",
        "parts": [
          {
            "text": "Explain quantum computing in simple terms"
          }
        ]
      }
    ],
    "generationConfig": {
      "responseMimeType": "text/plain"
    }
}
EOF

echo "Sending request to Gemini API..."
curl \
-X POST \
-H "Content-Type: application/json" \
"https://generativelanguage.googleapis.com/v1beta/models/${MODEL_ID}:${GENERATE_CONTENT_API}?key=${GEMINI_API_KEY}" -d '@request.json'

echo ""
echo "Test completed."

# Clean up
rm request.json