#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
const server = new Server({
    name: 'hello-world-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: 'greet',
            description: 'Returns a greeting message',
            inputSchema: {
                type: 'object',
                properties: {
                    name: {
                        type: 'string',
                        description: 'Name to greet',
                    },
                },
                required: ['name'],
            },
        },
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'greet') {
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${request.params.name}`);
    }
    if (!request.params.arguments?.name) {
        throw new McpError(ErrorCode.InvalidParams, 'Missing required parameter: name');
    }
    const name = request.params.arguments.name;
    return {
        content: [
            {
                type: 'text',
                text: `Hello, ${name}! Welcome to the MCP world!`,
            },
        ],
    };
});
const transport = new StdioServerTransport();
await server.connect(transport);
console.error('Hello World MCP server running on stdio');
