# Mastra AI Agent Implementation Plan

This document outlines the comprehensive plan for implementing a Mastra AI agent as a Supabase Edge Function based on the provided requirements.

## 1. Project Structure

```
supabase/
└── functions/
    └── mastra/
        ├── index.ts                 # Main entry point for the Edge Function
        ├── tools/                   # Directory for custom tools
        │   ├── weather.ts           # Example weather tool implementation
        │   └── index.ts             # Tool exports
        ├── middleware/              # Middleware components
        │   ├── cors.ts              # CORS handling
        │   ├── auth.ts              # Authentication logic
        │   └── index.ts             # Middleware exports
        ├── config/                  # Configuration
        │   └── index.ts             # Configuration exports and environment handling
        ├── types/                   # TypeScript type definitions
        │   └── index.ts             # Type exports
        ├── tests/                   # Test files
        │   ├── integration.test.ts  # Integration tests
        │   ├── unit.test.ts         # Unit tests
        │   └── mocks/               # Test mocks
        ├── deno.json                # Deno configuration
        ├── import_map.json          # Import map for dependencies
        ├── implementation-plan.md   # This document
        └── README.md                # Project documentation
```

## 2. Implementation Approach

### 2.1 Core Components

#### 2.1.1 Main Entry Point (`index.ts`)

The main entry point will:
- Import necessary dependencies
- Initialize the Mastra AI agent with appropriate configuration
- Set up request handling with middleware
- Export the server handler for Supabase Edge Functions

```typescript
// Pseudocode for index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Agent } from "@mastra/core/agent";
import { corsMiddleware } from "./middleware/cors.ts";
import { authMiddleware } from "./middleware/auth.ts";
import { tools } from "./tools/index.ts";
import { config } from "./config/index.ts";

// Initialize Mastra agent
const agent = new Agent({
  name: config.agentName,
  instructions: config.agentInstructions,
  tools,
});

// Request handler with middleware
const handleRequest = async (req: Request): Promise<Response> => {
  // Apply middleware
  const corsResult = await corsMiddleware(req);
  if (corsResult) return corsResult;
  
  const authResult = await authMiddleware(req);
  if (authResult) return authResult;
  
  try {
    // Process request
    const { query } = await req.json();
    
    // Generate response using Mastra agent
    const response = await agent.generate([
      { role: "user", content: query },
    ]);
    
    // Return response
    return new Response(
      JSON.stringify({ response: response.text }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    // Error handling
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// Start the server
serve(handleRequest);
```

#### 2.1.2 Tools Implementation

Tools will be modular and follow the Mastra AI tool pattern:

```typescript
// Pseudocode for tools/weather.ts
import { createTool } from "@mastra/core/tools";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

export const weatherTool = createTool({
  id: "Get Weather",
  description: "Get the current weather for a location",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ context: { location } }) => {
    // Implementation will use environment variables for API keys
    // No hardcoded secrets
    const apiKey = Deno.env.get("WEATHER_API_KEY");
    
    // Make API call to weather service
    // Replace with actual implementation
    return { temperature: 25, condition: "Sunny", location };
  },
});
```

#### 2.1.3 Middleware Components

Middleware will be implemented as separate modules:

```typescript
// Pseudocode for middleware/cors.ts
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export const corsMiddleware = (req: Request): Response | null => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
};
```

```typescript
// Pseudocode for middleware/auth.ts
import { config } from "../config/index.ts";

export const authMiddleware = (req: Request): Response | null => {
  const authHeader = req.headers.get("Authorization");
  
  // Authentication logic using environment variables
  // No hardcoded secrets
  if (!authHeader || !isValidAuth(authHeader)) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
};

const isValidAuth = (authHeader: string): boolean => {
  // Implementation will use environment variables
  const expectedToken = Deno.env.get("AUTH_TOKEN");
  return authHeader === `Bearer ${expectedToken}`;
};
```

### 2.2 Configuration Management

Configuration will be centralized and environment-aware:

```typescript
// Pseudocode for config/index.ts
export const config = {
  agentName: Deno.env.get("AGENT_NAME") || "MastraAgent",
  agentInstructions: Deno.env.get("AGENT_INSTRUCTIONS") || 
    "You are a helpful assistant that provides information and assistance.",
  // Other configuration values
};
```

## 3. Environment Variable Handling

### 3.1 Environment Variables Structure

The implementation will use the following environment variables:

```
# Agent Configuration
AGENT_NAME=MastraAgent
AGENT_INSTRUCTIONS=You are a helpful assistant that provides information and assistance.

# Authentication
AUTH_TOKEN=your-secret-token

# API Keys
WEATHER_API_KEY=your-weather-api-key
# Add other API keys as needed
```

### 3.2 Environment Variable Access

Environment variables will be accessed using Deno's built-in `Deno.env.get()` method:

```typescript
// Example of environment variable access
const apiKey = Deno.env.get("WEATHER_API_KEY");
if (!apiKey) {
  console.error("Missing required environment variable: WEATHER_API_KEY");
  // Handle missing environment variable
}
```

### 3.3 Local Development

For local development, a `.env` file will be used with the Supabase CLI:

```bash
# Command to run locally with environment variables
supabase functions serve mastra --env-file .env
```

### 3.4 Production Deployment

For production, environment variables will be set using the Supabase CLI:

```bash
# Command to set environment variables
supabase secrets set --env-file .env

# Command to deploy with environment variables
supabase functions deploy mastra
```

## 4. Testing Strategy

### 4.1 Unit Testing

Unit tests will focus on individual components:

```typescript
// Pseudocode for tests/unit.test.ts
import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { weatherTool } from "../tools/weather.ts";
import { authMiddleware } from "../middleware/auth.ts";

Deno.test("Weather tool returns expected data", async () => {
  // Mock environment variables
  Deno.env.set("WEATHER_API_KEY", "test-key");
  
  const result = await weatherTool.execute({ context: { location: "New York" } });
  assertEquals(typeof result.temperature, "number");
  assertEquals(typeof result.condition, "string");
  assertEquals(result.location, "New York");
});

Deno.test("Auth middleware rejects invalid token", () => {
  // Mock environment variables
  Deno.env.set("AUTH_TOKEN", "valid-token");
  
  // Create mock request with invalid token
  const req = new Request("https://example.com", {
    headers: { Authorization: "Bearer invalid-token" },
  });
  
  const result = authMiddleware(req);
  assertEquals(result?.status, 401);
});
```

### 4.2 Integration Testing

Integration tests will test the complete request flow:

```typescript
// Pseudocode for tests/integration.test.ts
import { assertEquals } from "https://deno.land/std@0.177.0/testing/asserts.ts";
import { handleRequest } from "../index.ts";

Deno.test("Full request flow returns expected response", async () => {
  // Mock environment variables
  Deno.env.set("AUTH_TOKEN", "test-token");
  Deno.env.set("WEATHER_API_KEY", "test-key");
  
  // Create mock request
  const req = new Request("https://example.com", {
    method: "POST",
    headers: {
      "Authorization": "Bearer test-token",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: "What's the weather in New York?" }),
  });
  
  const response = await handleRequest(req);
  assertEquals(response.status, 200);
  
  const data = await response.json();
  assertEquals(typeof data.response, "string");
  // Additional assertions
});
```

### 4.3 Test Mocks

Test mocks will be used to isolate components:

```typescript
// Pseudocode for tests/mocks/agent.ts
export const mockAgent = {
  generate: async (messages) => {
    return {
      text: "This is a mock response",
      toolCalls: [],
    };
  },
};
```

### 4.4 Test Automation

Tests will be automated using Deno's built-in test runner:

```bash
# Command to run tests
deno test --allow-env --allow-net
```

## 5. Deployment Workflow

### 5.1 Local Development

1. Set up local environment:
   ```bash
   # Create .env file from example
   cp example.env .env
   
   # Edit .env file with appropriate values
   nano .env
   ```

2. Run locally:
   ```bash
   supabase functions serve mastra --env-file .env
   ```

3. Test with curl:
   ```bash
   curl -X POST http://localhost:54321/functions/v1/mastra \
     -H "Authorization: Bearer your-secret-token" \
     -H "Content-Type: application/json" \
     -d '{"query":"What is the weather in New York?"}'
   ```

### 5.2 Continuous Integration

1. Run tests:
   ```bash
   deno test --allow-env --allow-net
   ```

2. Lint code:
   ```bash
   deno lint
   ```

3. Format code:
   ```bash
   deno fmt
   ```

### 5.3 Deployment to Supabase

1. Set environment variables:
   ```bash
   supabase secrets set --env-file .env
   ```

2. Deploy function:
   ```bash
   supabase functions deploy mastra
   ```

3. Verify deployment:
   ```bash
   supabase functions list
   ```

### 5.4 Post-Deployment Verification

1. Test deployed function:
   ```bash
   curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
     -H "Authorization: Bearer your-secret-token" \
     -H "Content-Type: application/json" \
     -d '{"query":"What is the weather in New York?"}'
   ```

2. Monitor logs:
   ```bash
   supabase functions logs mastra
   ```

## 6. Future Enhancements

1. **Additional Tools**: Extend the agent with more specialized tools.
2. **Advanced Authentication**: Implement JWT validation or Supabase Auth integration.
3. **Rate Limiting**: Add rate limiting to prevent abuse.
4. **Logging and Monitoring**: Implement structured logging and monitoring.
5. **Streaming Responses**: Support streaming responses for long-running operations.
6. **Caching**: Implement caching for improved performance.

## 7. Conclusion

This implementation plan provides a structured approach to building a Mastra AI agent as a Supabase Edge Function. By following this plan, we can create a modular, testable, and maintainable agent that leverages the power of Mastra AI while adhering to best practices for Supabase Edge Functions.