# Gemini Tumbler

A service for anonymizing user data and rotating between different Gemini AI models with 90%+ cost reduction.

## Introduction

Gemini Tumbler is a privacy-focused service that provides two key capabilities:

1. **Model Rotation**: Automatically rotates between different Gemini AI models to optimize for cost, performance, and capability requirements.

2. **User Anonymization**: Implements a robust, daisy-chained system for user data obfuscation to enhance privacy and security.

3. **OpenAI Compatibility**: Provides OpenAI-compatible endpoints for seamless integration with applications built for the OpenAI API.

The service is designed to run as Supabase Edge Functions using Deno, making it lightweight, scalable, and easy to deploy.

## What is a Tumbler?

In privacy and cryptography contexts, a "tumbler" is a service that mixes and obfuscates digital identities or transactions to break the connection between source and destination. Similar to how a clothes dryer tumbles garments together, a digital tumbler mixes user data in a way that makes it difficult to trace back to the original source.

The Gemini Tumbler applies this concept by:
1. Breaking the direct connection between user identities and their data/requests
2. Using multi-stage processing to ensure no single component has access to both identity and content
3. Applying cryptographic techniques (hashing with salt) to create one-way transformations of sensitive data
4. Implementing a daisy-chain architecture where each function only knows what it needs to know

This approach provides strong privacy guarantees while still allowing useful processing of data.

## Features

### Model Rotation

The Gemini Tumbler can automatically rotate between different models based on:

- Time-based rotation (e.g., switch models every hour)
- Request-based rotation (e.g., switch after X number of requests)
- Capability requirements (e.g., use more powerful models for complex tasks)

This allows for optimizing costs while ensuring appropriate model capabilities for different types of requests.

### User Anonymization

The service implements a multi-stage anonymization process:

1. **Request Sanitization**: Removes identifying information from incoming requests
2. **Identity Hashing**: Creates one-way hashes of user identifiers with rotating salts
3. **Content Separation**: Processes content separately from identity information
4. **Response Anonymization**: Ensures responses don't contain identifying information

### OpenAI Compatibility

The service provides OpenAI-compatible endpoints that allow applications built for the OpenAI API to seamlessly use Google's Gemini models:

- `/chat/completions` - Compatible with OpenAI's chat completions endpoint
- `/chat` - Alias for `/chat/completions`

These endpoints accept standard OpenAI request formats and return responses in the OpenAI format, making it easy to switch from OpenAI to Gemini without changing your application code.

#### Default Model

The service uses `gemini-2.5-pro-exp-03-25` as the default model, which provides advanced reasoning capabilities and is comparable to GPT-4 Turbo.

#### Model Mapping

When using OpenAI model names in requests, they are automatically mapped to appropriate Gemini models:

- `gpt-3.5-turbo` → `gemini-1.5-flash`
- `gpt-4` → `gemini-1.5-pro`
- `gpt-4-turbo` → `gemini-2.5-pro-exp-03-25`
- `gpt-4-turbo-preview` → `gemini-2.5-pro-exp-03-25`

## API Endpoints

### Generate Text

```
POST /generate
```

Request body:
```json
{
  "prompt": "Your prompt here",
  "systemPrompt": "Optional system prompt",
  "model": "gemini-2.5-pro-exp-03-25",
  "temperature": 0.7,
  "maxTokens": 1024,
  "contributionConsent": true
}
```

### OpenAI-Compatible Chat Completions

```
POST /chat/completions
```

Request body:
```json
{
  "model": "gpt-4-turbo",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 1024
}
```

Response:
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

## Getting Started

### Prerequisites

- Deno runtime
- Google Gemini API key(s)

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and add your API keys
3. Run the service with `deno run --allow-net --allow-env --allow-read=.env src/index.ts`

### Testing

Run the OpenAI compatibility tests:

```bash
./tests/run-openai-compatibility-test.sh
```

## Configuration

The service can be configured through environment variables:

- `GEMINI_API_KEY`: Your primary Gemini API key
- `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, etc.: Additional API keys for rotation
- `DEFAULT_MODEL`: Default model to use (default: "gemini-2.5-pro-exp-03-25")
- `ROTATION_INTERVAL`: Time in milliseconds between model rotations (default: 3600000)
- `ANONYMOUS_CONTRIBUTION`: Enable/disable anonymous contribution (default: true)
- `CONTRIBUTION_ENDPOINT`: Endpoint for contribution data (optional)
- `PORT`: Port to run the server on (default: 3000)

## License

[MIT License](LICENSE)