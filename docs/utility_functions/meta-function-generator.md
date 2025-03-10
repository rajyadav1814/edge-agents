# Meta Function Generator

The `meta-function-generator` function is a Supabase Edge Function that dynamically generates new edge functions.

## Overview

This function provides a way to create new edge functions programmatically. It can generate function code, configuration files, and deploy the new functions to the Supabase project.

## Features

- Generate edge function code from templates
- Create configuration files (deno.json, import maps)
- Support for TypeScript and JavaScript
- Integration with MCP (Model Context Protocol)
- Automatic deployment of generated functions

## Architecture

The Meta Function Generator consists of several components:

- Function code generator
- Configuration file generator
- MCP server integration
- Deployment utilities

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_ACCESS_TOKEN` | Supabase access token for API authentication | Required |
| `SUPABASE_PROJECT_ID` | ID of the Supabase project | Required |
| `FUNCTION_TEMPLATE_PATH` | Path to function templates | `./templates` |

## API Usage

### Endpoint

```
POST /functions/v1/meta-function-generator
```

### Request Format

```json
{
  "functionName": "my-new-function",
  "template": "basic-http",
  "parameters": {
    "endpoint": "/api/data",
    "method": "GET",
    "responseType": "json"
  },
  "deploy": true
}
```

### Response Format

```json
{
  "success": true,
  "functionId": "func_12345abcdef",
  "files": [
    "index.ts",
    "deno.json"
  ],
  "deploymentStatus": "success"
}
```

## Templates

The function supports several built-in templates:

- `basic-http`: Simple HTTP endpoint
- `database-crud`: CRUD operations for a database table
- `auth-webhook`: Authentication webhook
- `scheduled-job`: Function that runs on a schedule
- `mcp-tool`: MCP tool implementation

## MCP Integration

The function can generate MCP-compatible functions that implement:

- MCP tools
- MCP resources
- MCP resource templates

## Security Considerations

- Access to this function should be restricted
- Generated functions should be reviewed before deployment
- Proper error handling and validation is essential
- Avoid generating functions with hardcoded credentials