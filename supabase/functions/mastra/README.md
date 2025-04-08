# Mastra AI Agent

## Overview

Mastra AI Agent is a powerful, extensible AI assistant implemented as a Supabase Edge Function. It provides a flexible framework for building AI-powered applications with natural language processing capabilities and custom tool integrations.

This agent serves as a bridge between your applications and AI capabilities, allowing you to create context-aware, intelligent interactions through a simple API.

## Features

- **AI-Powered Responses**: Generate intelligent, contextual responses to user queries
- **Extensible Tool System**: Add custom capabilities through a modular tool architecture
- **Conversation Context**: Maintain conversation history for contextual interactions
- **Secure Authentication**: Built-in token-based authentication
- **CORS Support**: Cross-Origin Resource Sharing for web application integration
- **Environment Configuration**: Flexible configuration through environment variables
- **Comprehensive Testing**: Unit and integration tests for reliability
- **Supabase Integration**: Seamless deployment to Supabase Edge Functions

## Architecture

The Mastra AI agent is built with a modular architecture that separates concerns and promotes maintainability:

```
supabase/
└── functions/
    └── mastra/
        ├── index.ts                 # Main entry point
        ├── tools/                   # Custom tool implementations
        │   ├── weather.ts           # Weather tool example
        │   └── index.ts             # Tool exports
        ├── middleware/              # Request middleware
        │   ├── cors.ts              # CORS handling
        │   ├── auth.ts              # Authentication
        │   └── index.ts             # Middleware exports
        ├── config/                  # Configuration
        │   └── index.ts             # Environment variables
        ├── types/                   # TypeScript definitions
        │   └── index.ts             # Type exports
        ├── tests/                   # Test files
        └── ...
```

### Core Components

1. **Request Handler**: Processes incoming HTTP requests and returns appropriate responses
2. **Middleware**: Handles cross-cutting concerns like authentication and CORS
3. **Tools**: Modular capabilities that extend the agent's functionality
4. **Configuration**: Environment-based settings for flexible deployment
5. **Type Definitions**: TypeScript interfaces for type safety and documentation

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) (v1.30.0 or higher)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A Supabase project

### Local Development Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd edge-agents
```

2. Create a local environment file:

```bash
cd supabase/functions/mastra
cp .env.example .env
```

3. Edit the `.env` file with your configuration values:

```
# Agent Configuration
AGENT_NAME=MastraAgent
AGENT_INSTRUCTIONS=You are a helpful assistant that provides information and assistance.

# Authentication
AUTH_TOKEN=your-secret-token

# API Keys
WEATHER_API_KEY=your-weather-api-key
# Add other API keys as needed

# Supabase Configuration (if needed)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Logging
LOG_LEVEL=info
```

4. Start the local development server:

```bash
supabase functions serve mastra --env-file .env
```

5. Test the function with curl:

```bash
curl -X POST http://localhost:54321/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the weather in New York?"}'
```

## Environment Variables

The Mastra AI agent uses the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `AGENT_NAME` | Name of the AI agent | `MastraAgent` |
| `AGENT_INSTRUCTIONS` | System instructions for the agent | `You are a helpful assistant...` |
| `AUTH_TOKEN` | Authentication token for API access | (Required) |
| `WEATHER_API_KEY` | API key for weather service | (Optional) |
| `SUPABASE_URL` | Supabase project URL | (Optional) |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | (Optional) |
| `LOG_LEVEL` | Logging level (debug, info, warn, error) | `info` |

## API Reference

### Endpoint

```
POST /functions/v1/mastra
```

### Headers

- `Content-Type: application/json` (required)
- `Authorization: Bearer <your-token>` (required if authentication is enabled)

### Request Body

```json
{
  "query": "Your question or command here",
  "context": {
    "key1": "value1",
    "key2": "value2"
  },
  "history": [
    {
      "role": "user",
      "content": "Previous user message"
    },
    {
      "role": "assistant",
      "content": "Previous assistant response"
    }
  ]
}
```

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `query` | string | The user's question or command | Yes |
| `context` | object | Additional context information | No |
| `history` | array | Previous messages in the conversation | No |

### Response

```json
{
  "response": "The agent's response text",
  "toolCalls": [
    {
      "id": "call-123",
      "name": "get-weather",
      "arguments": {
        "location": "New York"
      },
      "result": {
        "temperature": 25,
        "condition": "Sunny",
        "location": "New York",
        "humidity": 60,
        "windSpeed": 10,
        "unit": "celsius"
      }
    }
  ],
  "metadata": {
    "processedAt": "2025-04-03T16:45:00.000Z",
    "agentName": "MastraAgent"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | The agent's text response |
| `toolCalls` | array | Optional tool calls made during processing |
| `metadata` | object | Additional information about the response |

### Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "additionalInfo": "More details about the error"
  }
}
```

## Deployment

### Deploying to Supabase

1. Set environment variables:

```bash
supabase secrets set --env-file .env
```

2. Deploy the function:

```bash
supabase functions deploy mastra
```

3. Verify the deployment:

```bash
supabase functions list
```

### Testing the Deployed Function

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the weather in New York?"}'
```

## Extending the Agent

### Adding a New Tool

1. Create a new tool file in the `tools` directory:

```typescript
// tools/calculator.ts
import { z } from "zod";
import { Tool, ToolExecuteParams } from "../types/index.ts";

// Input schema for the calculator tool
const calculatorInputSchema = z.object({
  expression: z.string().min(1, "Expression is required"),
});

// Type for calculator tool input
type CalculatorInput = z.infer<typeof calculatorInputSchema>;

// Implementation of the calculator tool
export const calculatorTool: Tool = {
  id: "calculator",
  description: "Calculate the result of a mathematical expression",
  
  execute: async (params: ToolExecuteParams): Promise<{ result: number }> => {
    try {
      // Validate input
      const input = calculatorInputSchema.parse(params.context) as CalculatorInput;
      const { expression } = input;
      
      // Simple evaluation (in a real implementation, use a safer method)
      // This is just for demonstration
      const result = eval(expression);
      
      return { result };
    } catch (error: unknown) {
      console.error("Error in calculator tool:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to calculate: ${errorMessage}`);
    }
  }
};

export default calculatorTool;
```

2. Add the tool to the tools index:

```typescript
// tools/index.ts
import { weatherTool } from "./weather.ts";
import { calculatorTool } from "./calculator.ts";
import { Tool } from "../types/index.ts";

export const tools: Tool[] = [
  weatherTool,
  calculatorTool,
  // Add more tools here
];

// Rest of the file...
```

3. Test your new tool:

```bash
curl -X POST http://localhost:54321/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"Calculate 2 + 2"}'
```

## Testing

### Running Tests

```bash
deno test --allow-env --allow-net
```

### Writing Tests

```typescript
// Example test for a tool
Deno.test("Calculator tool returns correct result", async () => {
  const result = await calculatorTool.execute({ 
    context: { expression: "2 + 2" } 
  });
  assertEquals(result.result, 4);
});
```

## Troubleshooting

### Common Issues

#### Authentication Errors

- **Issue**: Receiving 401 Unauthorized responses
- **Solution**: Verify that the `AUTH_TOKEN` environment variable is set correctly and that you're including the correct token in the Authorization header with the "Bearer " prefix.

#### CORS Errors

- **Issue**: Browser applications receive CORS errors when calling the function
- **Solution**: The function includes CORS headers by default. If you're still experiencing issues, check that your request includes the appropriate headers and that you're handling preflight (OPTIONS) requests correctly.

#### Missing Environment Variables

- **Issue**: Function fails with errors about missing configuration
- **Solution**: Ensure all required environment variables are set. For local development, check your `.env` file. For deployed functions, use `supabase secrets list` to verify your secrets.

#### Tool Execution Errors

- **Issue**: Errors when executing specific tools
- **Solution**: Check the tool implementation and ensure any required API keys or configurations are set. Look for error messages in the function logs.

### Viewing Logs

```bash
# For local development
# Logs are printed to the console

# For deployed functions
supabase functions logs mastra
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the [MIT License](LICENSE).