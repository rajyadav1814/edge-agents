#!/bin/bash

# Test the main endpoint
echo "Testing PR analysis endpoint..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "owner": "ruvnet",
    "repo": "edge-agents",
    "prNumber": 1,
    "modelName": "gpt-4o-mini"
  }' \
  "${SUPABASE_URL}/functions/git-pull-fixer"

# Test the interpreter endpoint
echo -e "\n\nTesting code interpreter endpoint..."
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{
    "code": "def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nprint(fibonacci(10))",
    "modelName": "gpt-4o-mini"
  }' \
  "${SUPABASE_URL}/functions/git-pull-fixer/interpreter"