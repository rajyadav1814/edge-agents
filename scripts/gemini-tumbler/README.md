# Gemini Tumbler Service

A service that manages multiple Gemini API models with rate limiting and rotation capabilities.

## Features

- Model rotation with configurable intervals
- Multi-key support for high availability
- Rate limiting detection and handling
- Anonymous contribution collection (optional)
- Model Control Panel (MCP) integration

## Getting Started

1. Copy `.env.example` to `.env` and configure your API keys:
```bash
cp .env.example .env
```

2. Add your Gemini API keys to the `.env` file:
```env
GEMINI_API_KEY=your_primary_key
GEMINI_API_KEY_2=your_second_key
GEMINI_API_KEY_3=your_third_key
```

3. Start the tumbler server:
```bash
./start-tumbler-server.sh
```

## MCP Integration

The Gemini Tumbler service integrates with the Model Control Panel (MCP) system for advanced monitoring and control capabilities.

### Starting the MCP Server

1. Configure MCP settings in `.env`:
```env
MCP_PORT=3001
MCP_AUTH_TOKEN=your_secure_token
```

2. Start the MCP server:
```bash
./start-mcp-server.sh
```

### Available MCP Tools

1. **Response Analysis Tool**
   - Name: `analyze-response`
   - Description: Analyzes Gemini model responses for quality and patterns
   - Metrics: coherence, relevance, toxicity
   - Usage:
   ```typescript
   const result = await mcpClient.getTool("analyze-response").execute({
     response: tumblerResponse
   });
   ```

2. **Code Modification Tool**
   - Name: `modify-code`
   - Description: Modifies tumbler service code based on specified parameters
   - Operations: update_rotation_strategy, update_rate_limiting, update_config
   - Usage:
   ```typescript
   const result = await mcpClient.getTool("modify-code").execute({
     path: "src/agent/tumblerService.ts",
     type: "update_rotation_strategy",
     params: { interval: 5000 }
   });
   ```

### MCP Client Usage

```typescript
import { McpClient } from "./mcp/mcpClient.ts";

// Initialize client
const client = new McpClient({
  serverUrl: "http://localhost:3001",
  authToken: "your_secure_token"
});

await client.initialize();

// Use tools
const tool = client.getTool("analyze-response");
const result = await tool.execute({
  response: tumblerResponse
});

console.log("Analysis result:", result);
```

## Testing

Run the test suite:
```bash
./run-tests.sh
```

Run MCP integration tests:
```bash
deno test src/mcp/mcp.test.ts
```

## Contributing

1. Ensure all code changes are covered by tests
2. Run the test suite before submitting changes
3. Follow the existing code style and formatting
4. Update documentation as needed

## License

MIT License