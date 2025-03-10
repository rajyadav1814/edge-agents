# Test Function

The `test-function` function is a Supabase Edge Function designed for testing and development purposes.

## Overview

This function provides a sandbox environment for testing various Edge Function features and capabilities. It can be used during development to experiment with new functionality or to verify that the Edge Functions infrastructure is working correctly.

## Features

- Testing HTTP methods and request handling
- Experimenting with environment variables
- Testing database connections
- Simulating different response types
- Debugging and logging capabilities

## Configuration

The function includes basic configuration files:

- `.npmrc`: NPM configuration for package management
- `deno.json`: Deno configuration for TypeScript support and imports

## Environment Variables

The function can be configured with various environment variables for testing purposes:

| Variable | Description | Default |
|----------|-------------|---------|
| `TEST_MODE` | Mode for the test function | `"standard"` |
| `TEST_DELAY` | Simulated processing delay in milliseconds | `0` |
| `TEST_ERROR_RATE` | Percentage chance of simulating an error | `0` |

## API Usage

### Endpoint

```
/functions/v1/test-function
```

### HTTP Methods

The function supports all standard HTTP methods:

- `GET`: Returns basic information about the function
- `POST`: Processes and returns the request body
- `PUT`: Updates a simulated resource
- `DELETE`: Removes a simulated resource
- `OPTIONS`: Handles CORS preflight requests

### Request Parameters

The function accepts various query parameters and request body formats to test different scenarios:

- `?mode=echo`: Echoes back the request
- `?mode=error`: Simulates an error response
- `?mode=delay&ms=2000`: Simulates a delayed response
- `?mode=stream`: Demonstrates streaming response

## Example Usage

### Basic Test

```bash
curl https://example.supabase.co/functions/v1/test-function
```

### Echo Test

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"test": "data"}' \
  https://example.supabase.co/functions/v1/test-function?mode=echo
```

## Development

This function can be modified to test specific scenarios or features during development. Its flexible structure allows for easy adaptation to different testing needs.

## Security Considerations

- This function should not be exposed in production environments
- It should not handle sensitive data
- Access should be restricted to development and testing environments