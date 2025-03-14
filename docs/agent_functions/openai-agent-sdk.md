# OpenAI Agent SDK

The OpenAI Agent SDK provides a standardized interface for building agents powered by OpenAI's language models.

## Features

- OpenAI API integration
- Streaming response support
- Error handling and retry logic
- Context management
- Type-safe interfaces

## Configuration

Required environment variables:
```
OPENAI_API_KEY=your_api_key
```

## Usage

```typescript
import { OpenAIAgent } from '../openai-agent-sdk';

const agent = new OpenAIAgent({
  model: 'gpt-4o-mini',
  temperature: 0.7
});

const response = await agent.complete({
  prompt: 'Your prompt here'
});
```

## API Reference

### Methods

- `complete(options)`: Generate a completion response
- `stream(options)`: Stream response tokens
- `embeddings(text)`: Generate embeddings for text

### Options

- `model`: OpenAI model to use (gpt-4o-mini, gpt-4o-search-preview)
- `temperature`: Sampling temperature
- `maxTokens`: Maximum tokens to generate
- `stop`: Stop sequences
- `stream`: Enable streaming mode