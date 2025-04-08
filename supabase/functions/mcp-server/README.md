# Supabase MCP Server

This is a Model Context Protocol (MCP) server implementation for Supabase Edge Functions. It allows AI assistants to interact with your Supabase database and other resources through a standardized protocol.

## Features

- **Supabase Integration**: Connect directly to your Supabase database and services
- **Authentication**: Secure your MCP server with authentication
- **Extensible**: Add custom tools and resources to extend functionality
- **Edge Function**: Deploy as a Supabase Edge Function for low-latency responses

## Directory Structure

```
supabase/functions/mcp-server/
├── core/                 # Core server implementation
│   ├── server.ts         # Main server implementation
│   └── auth.ts           # Authentication manager
├── tools/                # Tool implementations
├── resources/            # Resource implementations
├── tests/                # Test files
│   ├── core/             # Core tests
│   ├── tools/            # Tool tests
│   ├── resources/        # Resource tests
│   └── integration/      # Integration tests
├── scripts/              # Utility scripts
│   ├── deploy.sh         # Deployment script
│   ├── local-run.sh      # Local run script
│   └── test.sh           # Test script
└── README.md             # This file
```

## Getting Started

### Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Deno](https://deno.land/)
- A Supabase project

### Environment Variables

Create a `.env` file in the project root with the following variables:

```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_PROJECT_ID=your_project_id
MCP_SECRET_KEY=your_secret_key
```

### Local Development

To run the server locally:

```bash
# Run tests and start the server
bash supabase/functions/mcp-server/scripts/local-run.sh

# Run tests only
bash supabase/functions/mcp-server/scripts/local-run.sh test

# Run the server only
bash supabase/functions/mcp-server/scripts/local-run.sh run
```

### Deployment

To deploy the server to Supabase:

```bash
bash scripts/supabase/mcp-server/deploy-mcp-server.sh
```

## Adding Custom Tools

To add a custom tool, create a new file in the `tools` directory:

```typescript
// tools/example-tool.ts
import { Server } from 'https://esm.sh/@modelcontextprotocol/sdk/server/index.js';

export function registerExampleTool(server: Server) {
  server.setTool({
    name: 'example_tool',
    description: 'An example tool',
    inputSchema: {
      type: 'object',
      properties: {
        param1: {
          type: 'string',
          description: 'A parameter',
        },
      },
      required: ['param1'],
    },
    handler: async (params) => {
      // Tool implementation
      return {
        content: [
          {
            type: 'text',
            text: `Received parameter: ${params.param1}`,
          },
        ],
      };
    },
  });
}
```

Then register the tool in `tools/index.ts`:

```typescript
import { Server } from 'https://esm.sh/@modelcontextprotocol/sdk/server/index.js';
import { registerExampleTool } from './example-tool.ts';

export function setupTools(server: Server) {
  registerExampleTool(server);
  // Register other tools here
}
```

## Adding Custom Resources

To add a custom resource, create a new file in the `resources` directory:

```typescript
// resources/example-resource.ts
import { Server } from 'https://esm.sh/@modelcontextprotocol/sdk/server/index.js';

export function registerExampleResource(server: Server) {
  server.addResource({
    uri: 'example://data',
    name: 'Example Resource',
    description: 'An example resource',
    handler: async () => {
      // Resource implementation
      return {
        mimeType: 'application/json',
        text: JSON.stringify({ data: 'example' }),
      };
    },
  });
}
```

Then register the resource in `resources/index.ts`:

```typescript
import { Server } from 'https://esm.sh/@modelcontextprotocol/sdk/server/index.js';
import { registerExampleResource } from './example-resource.ts';

export function setupResources(server: Server) {
  registerExampleResource(server);
  // Register other resources here
}
```

## Testing

To run the tests:

```bash
bash supabase/functions/mcp-server/scripts/test.sh
```

## License

MIT