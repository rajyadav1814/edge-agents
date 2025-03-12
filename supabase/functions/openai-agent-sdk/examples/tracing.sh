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
    "input": "What is the weather like?",
    "agents": {
      "weather_agent": {
        "name": "weather_agent",
        "instructions": "You are a weather expert. Provide accurate weather information.",
        "model": "gpt-4-1106-preview",
        "trace": {
          "enabled": true,
          "level": "debug",
          "include_llm_calls": true,
          "include_tool_calls": true,
          "include_agent_state": true
        }
      }
    },
    "agent": "weather_agent"
  }'