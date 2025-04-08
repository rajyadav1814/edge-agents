# OpenAI Agent SDK Examples

This directory contains example scripts demonstrating various features of the OpenAI Agent SDK.

## Setup

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Update the environment variables in `.env` with your actual values:
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Make the scripts executable:
```bash
chmod +x *.sh
```

## Examples

### 1. Web Search (`web-search.sh`)
Demonstrates the web search capabilities using the `gpt-4o-search-preview` model:
- Basic web search
- Location-aware search
- Current events search
- Technical research
```bash
./web-search.sh
```

Features:
- Real-time web search
- Location awareness
- Citation handling
- Configurable search context size

### 2. Database Query (`database-query.sh`)
Shows how to interact with the Supabase database:
- Basic table queries
- Filtered queries
- Error handling
```bash
./database-query.sh
```

### 3. Agent Handoff (`agent-handoff.sh`)
Demonstrates agent switching between research and database operations:
- Automatic agent selection
- Context preservation
- Multi-agent collaboration
```bash
./agent-handoff.sh
```

### 4. Streaming (`streaming.sh`)
Shows real-time streaming responses:
- Text streaming
- Tool call streaming
- Event handling
```bash
./streaming.sh
```

### 5. Guardrails (`guardrails.sh`)
Demonstrates content filtering and safety features:
- Default guardrail
- Custom guardrail implementation
- Error handling
```bash
./guardrails.sh
```

## Debug Mode

Enable debug logging by setting the following environment variables:
```bash
LLM_DEBUG=true
AGENT_LIFECYCLE=true
TOOL_DEBUG=true
```

## Response Formats

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

## Web Search Options

The SDK supports location-aware search through web_search_options:

```json
{
  "web_search_options": {
    "user_location": {
      "type": "approximate",
      "approximate": {
        "country": "US",
        "city": "San Francisco",
        "region": "California"
      }
    },
    "search_context_size": "medium"
  }
}
```

Options:
- `search_context_size`: "low" | "medium" | "high"
- `user_location`: Optional location context for relevant results

## Error Handling

The SDK provides comprehensive error handling:
- Input validation errors (400)
- Guardrail violations (500)
- Database errors (500)
- Model-specific errors (500)

Example error response:
```json
{
  "error": "Error message here"
}
