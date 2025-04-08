# Hello World Function

The `hello-world` function is a simple Supabase Edge Function that serves as an example and testing endpoint.

## Overview

This function provides a basic "Hello, World!" response, demonstrating the minimal implementation of a Supabase Edge Function. It can be used as a template for creating new functions or for testing that the Edge Functions infrastructure is working correctly.

## Features

- Simple HTTP response
- Minimal implementation
- CORS support
- Example of Deno runtime usage

## Configuration

The function includes basic configuration files:

- `.npmrc`: NPM configuration for package management
- `deno.json`: Deno configuration for TypeScript support and imports

## Environment Variables

This function does not require any environment variables by default, but can be configured with:

| Variable | Description | Default |
|----------|-------------|---------|
| `GREETING_MESSAGE` | Custom greeting message | `"Hello, World!"` |
| `GREETING_NAME` | Name to include in the greeting | `"User"` |

## API Usage

### Endpoint

```
GET /functions/v1/hello-world
```

### Response Format

```json
{
  "message": "Hello, World!",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "version": "1.0.0"
}
```

## HTTP Methods

The function supports the following HTTP methods:

- `GET`: Returns a greeting message
- `POST`: Accepts a name parameter and returns a personalized greeting
- `OPTIONS`: Handles CORS preflight requests

## Example Usage

### Basic Request

```bash
curl https://example.supabase.co/functions/v1/hello-world
```

### Personalized Greeting

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name": "John"}' \
  https://example.supabase.co/functions/v1/hello-world
```

## Development

This function can be used as a starting point for developing more complex functions. The simple implementation makes it easy to understand the basic structure of a Supabase Edge Function.

## Testing

The function can be tested locally using the Supabase CLI:

```bash
supabase functions serve hello-world
```

This will start a local server that you can use to test the function before deploying it to production.