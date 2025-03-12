#!/bin/bash

# Load environment variables from root .env file
if [ -f ".env" ]; then
  source ".env"
else
  echo "Error: .env file not found"
  exit 1
fi

curl -i -X POST "${SUPABASE_URL}/functions/v1/openai-agent-sdk" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "input": "Tell me a story about a brave knight",
    "agents": {
      "storyteller": {
        "name": "storyteller",
        "instructions": "You are a creative storyteller. Tell engaging stories with vivid details.",
        "model": "gpt-4-1106-preview",
        "stream": true
      }
    },
    "agent": "storyteller"
  }'
