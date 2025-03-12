#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';

class HelloWorldServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'hello-world-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupRequestHandlers();
  }

  private setupRequestHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'greet',
          description: 'Returns a greeting message',
          inputSchema: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: 'Name to greet'
              }
            },
            required: ['name']
          }
        }
      ]
    }));

    // Execute tool
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (request.params.name !== 'greet') {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`
        );
      }

      const params = request.params.arguments || {};
      if (!params || !params.name || typeof params.name !== 'string') {
        throw new McpError(
          ErrorCode.InvalidParams,
          'Name parameter is required and must be a string'
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Hello, ${params.name}! Welcome to the Model Context Protocol.`
          }
        ]
      };
    });
  }

  public async serve(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('hello-world-server MCP server running on stdio');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }
}

const server = new HelloWorldServer();
server.serve().catch(console.error);
