# Mastra AI Agent API Reference

This document provides comprehensive documentation for the Mastra AI agent API, including endpoints, request/response formats, authentication, and examples.

## Base URL

When deployed to Supabase Edge Functions, the base URL for the API will be:

```
https://<your-project-ref>.supabase.co/functions/v1/mastra
```

For local development, the base URL will be:

```
http://localhost:54321/functions/v1/mastra
```

## Authentication

The Mastra AI agent API uses token-based authentication. You must include an `Authorization` header with a Bearer token in your requests.

### Headers

```
Authorization: Bearer <your-auth-token>
```

The token should match the `AUTH_TOKEN` environment variable configured for the function.

### Authentication Errors

If authentication fails, you will receive a `401 Unauthorized` response:

```json
{
  "error": "Unauthorized: Missing Authorization header"
}
```

or

```json
{
  "error": "Unauthorized: Invalid token"
}
```

## Endpoints

### Generate Response

Generates a response from the Mastra AI agent based on the provided query.

```
POST /
```

#### Request Headers

| Header | Value | Required |
|--------|-------|----------|
| `Content-Type` | `application/json` | Yes |
| `Authorization` | `Bearer <your-auth-token>` | Yes |

#### Request Body

```json
{
  "query": "What's the weather in New York?",
  "context": {
    "location": "New York",
    "units": "celsius"
  },
  "history": [
    {
      "role": "user",
      "content": "Hello, can you help me with the weather?"
    },
    {
      "role": "assistant",
      "content": "Of course! I'd be happy to help you with weather information. Which location are you interested in?"
    }
  ]
}
```

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| `query` | string | The user's question or command | Yes |
| `context` | object | Additional context information to help the agent generate a more accurate response | No |
| `history` | array | Previous messages in the conversation for context | No |

#### Response

A successful response will have a `200 OK` status code and a JSON body:

```json
{
  "response": "The current weather in New York is partly cloudy with a temperature of 22°C. The humidity is 65%. Wind speed is 8 km/h.",
  "toolCalls": [
    {
      "id": "call-123",
      "name": "get-weather",
      "arguments": {
        "location": "New York"
      },
      "result": {
        "temperature": 22,
        "condition": "Partly Cloudy",
        "location": "New York",
        "humidity": 65,
        "windSpeed": 8,
        "unit": "celsius"
      }
    }
  ],
  "metadata": {
    "processedAt": "2025-04-03T16:45:00.000Z",
    "agentName": "MastraAgent"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `response` | string | The agent's text response to the query |
| `toolCalls` | array | Optional array of tool calls made during processing |
| `metadata` | object | Additional information about the response |

#### Error Response

If an error occurs, you will receive an appropriate HTTP status code and a JSON error response:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "additionalInfo": "More details about the error"
  }
}
```

| Status Code | Description |
|-------------|-------------|
| `400` | Bad Request - The request was malformed or missing required fields |
| `401` | Unauthorized - Authentication failed |
| `405` | Method Not Allowed - Only POST requests are supported |
| `500` | Internal Server Error - An error occurred while processing the request |

## Message Format

The `history` array in the request body contains messages that represent the conversation history. Each message has the following format:

```json
{
  "role": "user",
  "content": "Message content"
}
```

| Field | Type | Description | Allowed Values |
|-------|------|-------------|---------------|
| `role` | string | The role of the message sender | `user`, `assistant`, `system` |
| `content` | string | The content of the message | Any text |
| `toolCalls` | array | Optional tool calls associated with this message | Array of tool call objects |

## Tool Calls

Tool calls represent actions taken by the agent to fulfill a request. They have the following format:

```json
{
  "id": "call-123",
  "name": "tool-name",
  "arguments": {
    "param1": "value1",
    "param2": "value2"
  },
  "result": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier for the tool call |
| `name` | string | Name of the tool being called |
| `arguments` | object | Arguments passed to the tool |
| `result` | object | Optional result returned by the tool |

## Available Tools

The Mastra AI agent comes with the following built-in tools:

### Weather Tool

Gets weather information for a specified location.

```json
{
  "name": "get-weather",
  "arguments": {
    "location": "New York"
  }
}
```

Response:

```json
{
  "temperature": 22,
  "condition": "Partly Cloudy",
  "location": "New York",
  "humidity": 65,
  "windSpeed": 8,
  "unit": "celsius"
}
```

## Usage Examples

### Basic Query

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"What can you help me with?"}'
```

Response:

```json
{
  "response": "I'm the Mastra AI assistant. I can help you with various tasks, including checking the weather.",
  "metadata": {
    "processedAt": "2025-04-03T16:45:00.000Z",
    "agentName": "MastraAgent"
  }
}
```

### Weather Query

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the weather in London?"}'
```

Response:

```json
{
  "response": "The current weather in London is rainy with a temperature of 15°C. The humidity is 80%. Wind speed is 12 km/h.",
  "toolCalls": [
    {
      "id": "call-456",
      "name": "get-weather",
      "arguments": {
        "location": "London"
      },
      "result": {
        "temperature": 15,
        "condition": "Rainy",
        "location": "London",
        "humidity": 80,
        "windSpeed": 12,
        "unit": "celsius"
      }
    }
  ],
  "metadata": {
    "processedAt": "2025-04-03T16:46:00.000Z",
    "agentName": "MastraAgent"
  }
}
```

### Query with Context

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the weather like?",
    "context": {
      "location": "Tokyo",
      "units": "celsius"
    }
  }'
```

Response:

```json
{
  "response": "The current weather in Tokyo is sunny with a temperature of 28°C. The humidity is 55%. Wind speed is 5 km/h.",
  "toolCalls": [
    {
      "id": "call-789",
      "name": "get-weather",
      "arguments": {
        "location": "Tokyo"
      },
      "result": {
        "temperature": 28,
        "condition": "Sunny",
        "location": "Tokyo",
        "humidity": 55,
        "windSpeed": 5,
        "unit": "celsius"
      }
    }
  ],
  "metadata": {
    "processedAt": "2025-04-03T16:47:00.000Z",
    "agentName": "MastraAgent"
  }
}
```

### Query with Conversation History

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "And what about tomorrow?",
    "context": {
      "location": "Paris"
    },
    "history": [
      {
        "role": "user",
        "content": "What is the weather in Paris?"
      },
      {
        "role": "assistant",
        "content": "The current weather in Paris is sunny with a temperature of 20°C. The humidity is 60%. Wind speed is 7 km/h.",
        "toolCalls": [
          {
            "id": "call-101",
            "name": "get-weather",
            "arguments": {
              "location": "Paris"
            },
            "result": {
              "temperature": 20,
              "condition": "Sunny",
              "location": "Paris",
              "humidity": 60,
              "windSpeed": 7,
              "unit": "celsius"
            }
          }
        ]
      }
    ]
  }'
```

Response:

```json
{
  "response": "I'm sorry, but I don't have forecast capabilities at the moment. I can only provide current weather information. The current weather in Paris is sunny with a temperature of 20°C.",
  "metadata": {
    "processedAt": "2025-04-03T16:48:00.000Z",
    "agentName": "MastraAgent"
  }
}
```

## Error Handling

### Missing Required Field

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

Response:

```json
{
  "error": "Missing required field: query",
  "code": "MISSING_FIELD"
}
```

### Method Not Allowed

```bash
curl -X GET https://your-project-ref.supabase.co/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token"
```

Response:

```json
{
  "error": "Method not allowed. Only POST requests are supported."
}
```

## Rate Limiting

The Mastra AI agent does not currently implement rate limiting. However, Supabase Edge Functions may have their own rate limits. It's recommended to implement appropriate rate limiting in your application to prevent abuse.

## CORS Support

The API includes CORS (Cross-Origin Resource Sharing) support, allowing it to be called from web applications. The following headers are included in responses:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
Access-Control-Allow-Methods: GET, POST, OPTIONS
```

## Versioning

The API does not currently use explicit versioning. Future updates may introduce versioning through URL paths or headers.

## Support

If you encounter issues with the API, check the function logs:

```bash
supabase functions logs mastra
```

For local development, logs are printed to the console.