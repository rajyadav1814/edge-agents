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
    "input": "What are the latest AI developments and how many users are using them?",
    "agents": {
      "research_agent": {
        "name": "research_agent",
        "instructions": "You are a research agent that finds information using web search. Be thorough and cite your sources.",
        "tools": [{
          "name": "web_search",
          "description": "Search the web for current information",
          "parameters": {
            "type": "object",
            "properties": {
              "query": {
                "type": "string",
                "description": "The search query"
              }
            },
            "required": ["query"]
          }
        }],
        "model": "gpt-4-1106-preview"
      },
      "database_agent": {
        "name": "database_agent", 
        "instructions": "You are a database expert that can query and analyze data. Provide clear explanations of your findings.",
        "tools": [{
          "name": "database_query",
          "description": "Query the Supabase database",
          "parameters": {
            "type": "object",
            "properties": {
              "table": {
                "type": "string",
                "description": "The table to query"
              },
              "filter": {
                "type": "object",
                "description": "Filter conditions"
              }
            },
            "required": ["table"]
          }
        }],
        "model": "gpt-4-1106-preview"
      }
    }
  }'