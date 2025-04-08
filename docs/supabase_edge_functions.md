# Supabase Edge Functions

## Overview

Supabase Edge Functions are serverless functions that run at the edge of the network, closer to users. They provide low-latency, high-availability compute capabilities without the need to manage servers. Supabase Edge Functions are powered by Deno, a secure JavaScript/TypeScript runtime built on V8.

## Key Features

- **Global Distribution**: Functions are deployed globally for low-latency responses
- **Serverless Architecture**: No server management required
- **Deno Runtime**: Secure, modern JavaScript/TypeScript runtime
- **TypeScript Support**: Built-in TypeScript support without configuration
- **HTTP/WebSocket Support**: Handle HTTP requests and WebSocket connections
- **Database Integration**: Seamless integration with Supabase PostgreSQL database
- **Real-time Capabilities**: Integration with Supabase real-time channels
- **Environment Variables**: Secure management of secrets and configuration
- **Automatic Scaling**: Functions scale automatically with demand

## Architecture

Supabase Edge Functions are built on Deno Deploy, which provides a globally distributed network of edge servers. When a request is made to an edge function, it is routed to the nearest edge server, which executes the function and returns the response.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│   Client    │────▶│  Supabase   │────▶│  Function   │
│             │     │   Router    │     │  Execution  │
└─────────────┘     └─────────────┘     └─────────────┘
       ▲                                       │
       │                                       │
       └───────────────────────────────────────┘
                        Response
```

## Function Structure

A typical Supabase Edge Function has the following structure:

```typescript
// Import dependencies
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Define the handler function
const handler = async (req: Request): Promise<Response> => {
  // Process the request
  const { name } = await req.json();
  
  // Return a response
  return new Response(
    JSON.stringify({ message: `Hello, ${name}!` }),
    { headers: { "Content-Type": "application/json" } }
  );
};

// Start the server
serve(handler);
```

## Environment Variables

Supabase Edge Functions support environment variables for configuration and secrets management. Environment variables can be set in the Supabase dashboard or using the Supabase CLI.

```typescript
// Access environment variables
const apiKey = Deno.env.get("API_KEY");
const databaseUrl = Deno.env.get("DATABASE_URL");
```

## Deployment

Supabase Edge Functions can be deployed using the Supabase CLI or through the Supabase dashboard. The deployment process involves the following steps:

1. Install the Supabase CLI
2. Link your project
3. Deploy your function

```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Deploy your function
supabase functions deploy your-function-name
```

## Invoking Functions

Supabase Edge Functions can be invoked using HTTP requests. The URL format is:

```
https://<project-ref>.supabase.co/functions/v1/<function-name>
```

Example:

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/hello-world \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

## Limitations

- **Execution Time**: Functions have a maximum execution time of 60 seconds
- **Memory**: Functions have a maximum memory allocation of 1GB
- **Payload Size**: HTTP request and response payloads are limited to 6MB
- **Concurrency**: Functions have a default concurrency limit of 50 requests per second

## Best Practices

- **Keep Functions Small**: Focus on a single responsibility
- **Use TypeScript**: Leverage type safety for better code quality
- **Handle Errors**: Implement proper error handling
- **Cache Responses**: Use caching for improved performance
- **Monitor Usage**: Keep track of function invocations and performance
- **Secure Secrets**: Use environment variables for sensitive information
- **Test Locally**: Test functions locally before deployment

## Local Development

Supabase Edge Functions can be developed and tested locally using the Supabase CLI:

```bash
# Start local development server
supabase start

# Serve functions locally
supabase functions serve --no-verify-jwt

# Test your function
curl -X POST http://localhost:54321/functions/v1/hello-world \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

## Resources

- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)
- [Deno Documentation](https://deno.land/manual)
- [Supabase CLI Documentation](https://supabase.com/docs/reference/cli)

---

Created by rUv, Agentics Foundation founder.