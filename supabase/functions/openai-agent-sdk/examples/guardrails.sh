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
    "input": "Generate a SQL query",
    "agents": {
      "sql_expert": {
        "name": "sql_expert",
        "instructions": "You are a SQL expert. Generate safe and efficient queries.",
        "model": "gpt-4-1106-preview",
        "guardrails": {
          "allowed_tables": ["users", "products"],
          "max_joins": 2,
          "require_where": true,
          "banned_keywords": ["DROP", "DELETE", "TRUNCATE"]
        }
      }
    },
    "agent": "sql_expert"
  }'