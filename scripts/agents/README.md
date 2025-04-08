# Agent Development Directory

This directory contains development environments for various agent implementations before they are integrated into Supabase Edge Functions.

## Structure

```
agents/
├── openai-agent/           # OpenAI-based agent development
│   ├── .env               # Environment configuration
│   ├── agent.ts           # Agent implementation
│   ├── deno.json          # Deno configuration
│   └── README.md          # OpenAI agent documentation
└── README.md              # This file
```

## Purpose

The agents directory serves as a testing ground for developing and refining agent implementations before they are deployed as Supabase Edge Functions. This allows for:

1. Rapid Development
   - Quick iteration on agent features
   - Local testing and debugging
   - Environment variable management

2. Feature Testing
   - Web search capabilities
   - Database interactions
   - Streaming responses
   - Content filtering

3. Model Experimentation
   - Testing different OpenAI models
   - Evaluating model performance
   - Optimizing prompts and instructions

## Workflow

1. Development
   - Create new agent implementation in this directory
   - Test features locally
   - Refine and optimize

2. Testing
   - Run comprehensive tests
   - Verify all features work as expected
   - Test error handling and edge cases

3. Integration
   - Move stable implementations to Supabase functions
   - Update documentation
   - Deploy to production

## Current Agents

### OpenAI Agent
- Location: `/openai-agent`
- Features:
  - Web search using gpt-4o-search-preview
  - Database queries with Supabase
  - Streaming responses
  - Content filtering
  - Agent orchestration

### Adding New Agents

To add a new agent:

1. Create a new directory:
```bash
mkdir new-agent-name
```

2. Include required files:
```
new-agent-name/
├── .env.example          # Environment variable template
├── agent.ts             # Agent implementation
├── deno.json           # Deno configuration
└── README.md           # Agent documentation
```

3. Document the agent's:
   - Purpose and features
   - Environment requirements
   - Testing procedures
   - Integration steps

## Testing

Each agent should include example scripts demonstrating its capabilities. For example:

```bash
# Run the OpenAI agent
cd openai-agent
deno run --allow-net --allow-env agent.ts
```

## Environment Variables

Agents typically require environment variables for:
- API keys
- Database credentials
- Debug settings
- Model configurations

Copy the .env.example file to .env and update with your values:
```bash
cp .env.example .env
```

## Integration with Supabase

Once an agent is stable:

1. Copy the implementation to Supabase functions:
```bash
cp -r agent-name/ ../../supabase/functions/
```

2. Update the function configuration:
```bash
cd ../../supabase/functions/agent-name
# Update deno.json and other configs
```

3. Deploy the function:
```bash
supabase functions deploy agent-name
```

## Contributing

1. Create a new branch for your agent:
```bash
git checkout -b feature/new-agent-name
```

2. Develop and test your agent

3. Update documentation

4. Submit a pull request

## License

MIT