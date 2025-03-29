# OpenAI-Compatible Endpoints for Gemini Tumbler

This directory contains examples and implementation plans for adding OpenAI-compatible endpoints to the Gemini Tumbler service, with a focus on using the latest gemini-2.5-pro-exp-03-25 model as the default.

## Files

- `openai-compatible-streaming.ts` - Example implementation of OpenAI-compatible `/chat/completions` endpoint with streaming support
- `run-openai-compatible-server.sh` - Script to run the example server
- `test-openai-compatibility.sh` - Script to test the OpenAI-compatible endpoints

## Getting Started

### Prerequisites

- Deno runtime installed
- Google Gemini API key

### Running the Example Server

1. Set your Gemini API key as an environment variable:

```bash
export GEMINI_API_KEY=your_api_key_here
```

2. Run the server:

```bash
./run-openai-compatible-server.sh
```

This will start a server on port 3000 that provides an OpenAI-compatible `/chat/completions` endpoint.

### Testing the Endpoints

Use the provided test script to send requests to the server:

```bash
# Regular request
./test-openai-compatibility.sh

# Streaming request
./test-openai-compatibility.sh --stream

# Specify a different model
./test-openai-compatibility.sh --model=gpt-4

# Specify a different host or port
./test-openai-compatibility.sh --host=api.example.com --port=8080
```

## OpenAI Compatibility

The example implementation provides compatibility with OpenAI's API format:

### Request Format

```json
{
  "model": "gpt-4-turbo",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 150,
  "stream": false
}
```

### Response Format

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1677858242,
  "model": "gpt-4-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 13,
    "completion_tokens": 15,
    "total_tokens": 28
  }
}
```

### Streaming Format

For streaming responses, the server sends a series of Server-Sent Events (SSE) in the following format:

```
data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1677858242,"model":"gpt-4-turbo","choices":[{"index":0,"delta":{"role":"assistant"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1677858242,"model":"gpt-4-turbo","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1677858242,"model":"gpt-4-turbo","choices":[{"index":0,"delta":{"content":"!"},"finish_reason":null}]}

data: {"id":"chatcmpl-abc123","object":"chat.completion.chunk","created":1677858242,"model":"gpt-4-turbo","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}

data: [DONE]
```

## Model Mapping

The example implementation maps OpenAI model names to Gemini models:

- `gpt-3.5-turbo` → `gemini-1.5-flash`
- `gpt-4` → `gemini-1.5-pro`
- `gpt-4-turbo` → `gemini-2.5-pro-exp-03-25`
- `gpt-4-turbo-preview` → `gemini-2.5-pro-exp-03-25`

The default model is `gemini-2.5-pro-exp-03-25`, which is Google's latest and most capable model.

## Tumbler Integration

The example implementation simulates the Tumbler service's capabilities:

- Model selection and mapping
- Token usage tracking
- Response formatting
- Error handling

In a full implementation, this would be integrated with the actual Tumbler service to leverage:

- API key rotation
- Anonymous contribution
- Rate limiting
- Model rotation

## Integration with Existing Applications

This implementation allows you to use applications designed for OpenAI's API with Google's Gemini models. Simply point your application to this server instead of OpenAI's API endpoint.

For example, with the OpenAI Node.js client:

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'http://localhost:3000',
  apiKey: 'dummy-key' // Not used but required by the client
});

const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo', // Will use gemini-2.5-pro-exp-03-25
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});

console.log(response.choices[0].message.content);
```

## Further Development

For a complete implementation plan, see the `../plans/openai-compatible-endpoints.md` file.