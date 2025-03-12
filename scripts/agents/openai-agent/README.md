# OpenAI Agent Development Environment

This directory contains the development environment for the OpenAI Agent SDK. It serves as a testing ground for new features and improvements before they are integrated into the Supabase Edge Function.

## Directory Structure

```
openai-agent/
├── .env                 # Environment variables configuration
├── agent.ts            # Main agent implementation
├── deno.json           # Deno configuration
├── deno.lock           # Deno lock file
└── supabase/          # Supabase-related files
```

## Environment Variables

The `.env` file contains all necessary configuration:

- OpenAI Configuration
  - `OPENAI_API_KEY`: OpenAI API key
  - `OPENROUTER_MODEL`: Model configuration for OpenRouter
  - `OPENROUTER_API_KEY`: API key for OpenRouter

- Supabase Configuration
  - `SUPABASE_URL`: Supabase project URL
  - `SUPABASE_ANON_KEY`: Anonymous client key
  - `SUPABASE_PROJECT_ID`: Project identifier
  - Various other Supabase-related keys and configurations

## Development

### Running Locally

```bash
# Start the development server
deno run --allow-net --allow-env agent.ts

# With debug logging enabled
LLM_DEBUG=true AGENT_LIFECYCLE=true TOOL_DEBUG=true deno run --allow-net --allow-env agent.ts
```

### Testing Features

The agent supports:

1. Web Search
   - Uses `gpt-4o-search-preview` model
   - Location-aware search capabilities
   - Citation handling

2. Database Operations
   - Supabase database integration
   - Query and analysis capabilities
   - Error handling

3. Content Filtering
   - Default guardrail implementation
   - Custom guardrail support

4. Streaming Support
   - Real-time response streaming
   - Tool execution in stream mode

## Relationship to SDK

This development environment is used to test and refine features before they are integrated into the [OpenAI Agent SDK](../../supabase/functions/openai-agent-sdk/). The main differences are:

1. Development Focus
   - This environment: Feature development and testing
   - SDK: Production-ready implementation

2. Configuration
   - This environment: Local environment variables
   - SDK: Supabase Edge Function environment

3. Deployment
   - This environment: Local development server
   - SDK: Supabase Edge Function deployment

## Contributing

1. Make changes in this development environment
2. Test thoroughly using the provided tools
3. Once stable, port changes to the SDK
4. Update documentation in both locations
5. Submit pull request

## Testing

Test your changes using the provided curl commands:

```bash
# Basic query
curl -i -X POST "http://localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "What are the latest developments in AI?"
  }'

# Web search with location
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

# Database query
curl -i -X POST "http://localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Query the users table",
    "agent": "database_expert"
  }'

# Streaming mode
curl -i -X POST "http://localhost:8000" \
  -H "Content-Type: application/json" \
  -d '{
    "input": "Tell me a story",
    "stream": true
  }'
```

## Deployment

After testing, deploy your changes to the SDK:

1. Copy the tested changes to `supabase/functions/openai-agent-sdk/`
2. Update the SDK documentation
3. Deploy using Supabase CLI:
   ```bash
   supabase functions deploy openai-agent-sdk
   ```

## License

[Your License Here]
