# MCP Server Function

The `mcp-server` function implements a Model Context Protocol (MCP) server that enables communication between AI models and external systems.

## Overview

The MCP server provides a standardized way for AI models to access external resources and tools through a well-defined protocol. It acts as a bridge between AI models and various data sources, APIs, and system capabilities.

## Features

- Resource access: Provides access to database, storage, and system resources
- Tool execution: Enables AI models to execute tools for database operations, messaging, and system tasks
- Authentication: Secures access to resources and tools
- Realtime communication: Supports WebSocket-based communication for interactive sessions

## Architecture

The MCP server is built with a modular architecture:

- Core server implementation
- Resource registry and handlers
- Tool registry and handlers
- Authentication and security
- Error handling utilities

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | Required |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Required |
| `MCP_AUTH_SECRET` | Secret for authenticating MCP requests | Required |

## API Usage

### Resources

Resources represent data sources that can be accessed by AI models:

- Database resources: Access to Supabase database tables
- Storage resources: Access to Supabase storage buckets
- System resources: Access to system information and configuration

### Tools

Tools represent executable functions that AI models can invoke:

- Database tools: Query, insert, update, and delete database records
- Messaging tools: Send messages to users or other systems
- System tools: Execute system operations and retrieve information

## Testing

The MCP server includes comprehensive tests:

- Unit tests for core components
- Integration tests for end-to-end functionality
- Agent tests for simulating AI model interactions

## Deployment

The MCP server can be deployed as a Supabase Edge Function, making it accessible to AI models through HTTP requests.

## Security Considerations

- All requests must be authenticated
- Access to sensitive resources and tools is controlled
- Input validation prevents injection attacks
- Error handling avoids leaking sensitive information