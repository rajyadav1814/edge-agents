# OpenAI Agent SDK

A powerful SDK for building AI agents with web search, database querying, and streaming capabilities using OpenAI's GPT models.

## Features

### 1. Web Search Integration
- Uses `gpt-4o-search-preview` model for real-time web search
- Location-aware search capabilities
- Configurable search context size (low/medium/high)
- Automatic citation handling with URL references

### 2. Database Integration
- Built-in Supabase database connectivity
- Flexible query tool with filtering capabilities
- Error handling and result formatting
- Works with `gpt-4o-mini` model using function calling

### 3. Content Guardrails
- Configurable content filtering
- Default guardrail for inappropriate content
- Custom guardrail support
- Proper error handling for violations

### 4. Streaming Support
- Real-time streaming of AI responses
- Support for both search and non-search models
- Tool execution in streaming mode
- Event-based streaming with type safety

## Setup

1. Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration (for database features)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional Debug Configuration
LLM_DEBUG=true
AGENT_LIFECYCLE=true
TOOL_DEBUG=true
```

2. Installation
```bash
# Clone the repository
git clone your-repo-url

# Navigate to the function directory
cd supabase/functions/openai-agent-sdk

# Install dependencies
deno cache --reload index.ts
```

## Usage

### Basic Query
```bash
curl -i -X POST "http://localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What are the latest developments in AI?"
  }'
```

### Web Search with Location
```bash
curl -i -X POST "http://localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What are the best restaurants near Times Square?",
    "web_search_options": {
      "user_location": {
        "type": "approximate",
        "approximate": {
          "country": "US",
          "city": "New York",
          "region": "New York"
        }
      }
    }
  }'
```

### Database Query
```bash
curl -i -X POST "http://localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Query the users table",
    "agent": "database_expert"
  }'
```

### Streaming Mode
```bash
curl -i -X POST "http://localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Tell me a story",
    "stream": true
  }'
```

## Agent Types

### Research Agent
- Uses `gpt-4o-search-preview` model
- Web search capabilities
- Citation handling
- Location-aware search

### Database Expert Agent
- Uses `gpt-4o-mini` model
- Database query capabilities
- Result analysis
- Error handling

## Development

### Running Locally
```bash
deno run --allow-net --allow-env index.ts
```

### Debug Mode
Enable debug logging by setting environment variables:
```bash
LLM_DEBUG=true AGENT_LIFECYCLE=true TOOL_DEBUG=true deno run --allow-net --allow-env index.ts
```

### Testing
Test different features:
1. Web Search: Test with location-aware queries
2. Database: Test with various table queries
3. Guardrails: Test content filtering
4. Streaming: Test real-time responses

## Error Handling

The SDK provides comprehensive error handling:
- Input validation errors (400)
- Guardrail violations (500)
- Database errors (500)
- Model-specific errors (500)

## Response Format

### Non-streaming Response
```json
{
  "result": "The response text",
  "conversation": [
    {
      "role": "user",
      "content": "The user's input"
    },
    {
      "role": "assistant",
      "content": "The assistant's response",
      "name": "agent_name"
    }
  ]
}
```

### Streaming Response
```json
{"delta": "partial response", "type": "partial"}
{"delta": "tool result", "type": "tool_call"}
{"delta": "\n--- done ---", "type": "final"}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Your License Here]
