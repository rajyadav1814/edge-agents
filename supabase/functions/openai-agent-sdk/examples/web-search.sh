#!/bin/bash

# Load environment variables from root .env file
if [ -f ".env" ]; then
  source ".env"
else
  echo "Error: .env file not found"
  exit 1
fi

# Function to make the API request
make_request() {
  local input=$1
  local location=$2

  if [ -n "$location" ]; then
    # Request with location
    curl -i -X POST "$SUPABASE_URL/functions/v1/openai-agent-sdk" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -d "{
        \"input\": \"$input\",
        \"web_search_options\": {
          \"user_location\": {
            \"type\": \"approximate\",
            \"approximate\": $location
          },
          \"search_context_size\": \"medium\"
        }
      }"
  else
    # Basic request without location
    curl -i -X POST "$SUPABASE_URL/functions/v1/openai-agent-sdk" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
      -d "{
        \"input\": \"$input\"
      }"
  fi
}

# Example 1: Basic web search
echo "Example 1: Basic web search"
make_request "What are the latest developments in AI technology?"

# Example 2: Location-aware search
echo -e "\n\nExample 2: Location-aware search"
make_request "What are the best restaurants near me?" "{
  \"country\": \"US\",
  \"city\": \"San Francisco\",
  \"region\": \"California\"
}"

# Example 3: Current events search
echo -e "\n\nExample 3: Current events search"
make_request "What are the major news headlines today?"

# Example 4: Technical research
echo -e "\n\nExample 4: Technical research"
make_request "What are the latest advancements in quantum computing?"

# Example 5: Location-aware search with different location
echo -e "\n\nExample 5: Location-aware search (London)"
make_request "What events are happening this weekend?" "{
  \"country\": \"GB\",
  \"city\": \"London\",
  \"region\": \"England\"
}"
