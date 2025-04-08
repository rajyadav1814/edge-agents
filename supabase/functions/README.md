# Environment Variables Testing Utility

This directory contains utilities for testing and managing environment variables in Deno-based Supabase Edge Functions.

## Files

- `env_test.ts` - TypeScript utility for testing environment variables
- `run-env-test.sh` - Shell script to run the env_test.ts utility

## Usage

### Testing Environment Variables

The `env_test.ts` utility helps you verify that your environment variables are properly configured. It looks for variables in the following locations:

1. `/workspaces/agentics/agentic.env` (project root placeholder)
2. Local `.env` files in the functions directory
3. Environment variables loaded via the `--env-file` flag

To run the utility:

```bash
# Using the convenience script
./run-env-test.sh

# Or directly with Deno
deno run --env-file=/workspaces/agentics/agentic.env --allow-env --allow-read env_test.ts
```

### Required Environment Variables

The utility checks for the following required variables:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_ID`
- `MCP_SECRET_KEY`

### Environment File Format

The `agentic.env` file should follow standard .env format:

```
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_ID=your-project-id

# MCP Server Configuration
MCP_SECRET_KEY=your-mcp-secret-key
```

## Loading Environment Variables in Deno

The utility demonstrates three methods for loading environment variables in Deno:

1. Using the `--env-file` flag (recommended):
   ```
   deno run --env-file=/workspaces/agentics/agentic.env --allow-env your_script.ts
   ```

2. Auto-loading with JSR module:
   ```typescript
   import "jsr:@std/dotenv/load";
   console.log(Deno.env.get("VARIABLE_NAME"));
   ```

3. Manual loading with JSR module:
   ```typescript
   import { load } from "jsr:@std/dotenv/mod.ts";
   const env = await load({ path: "/workspaces/agentics/agentic.env" });
   console.log(env.VARIABLE_NAME);