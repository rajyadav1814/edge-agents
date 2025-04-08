# OpenAI Proxy with Stripe Metering

A Supabase Edge Function that acts as a proxy for OpenAI's API while handling usage metering through Stripe.

## Features

- OpenAI API proxy with streaming support
- Stripe metering for usage tracking
- Rate limiting with sliding window
- Subscription tier management
- Token counting and validation
- CORS support for browser access
- Comprehensive error handling

## Environment Variables

Required variables:
```bash
OPENAI_API_KEY=sk-...        # Your OpenAI API key
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
SUPABASE_URL=https://...     # Your Supabase project URL
SUPABASE_ANON_KEY=eyJ...     # Your Supabase anon key
```

Optional variables with defaults:
```bash
RATE_LIMIT_WINDOW=60000      # Rate limit window in milliseconds (default: 60000)
RATE_LIMIT_MAX_REQUESTS=60   # Maximum requests per window (default: 60)
CORS_ALLOWED_ORIGINS=*       # Comma-separated list of allowed origins (default: *)
```

## API Contract

### Request Format

```typescript
interface OpenAIRequest {
  model: string;
  messages: {
    role: "system" | "user" | "assistant" | "function";
    content: string;
    name?: string;
    function_call?: {
      name: string;
      arguments: string;
    };
  }[];
  temperature?: number;
  top_p?: number;
  n?: number;
  stream?: boolean;
  stop?: string | string[];
  max_tokens?: number;
  presence_penalty?: number;
  frequency_penalty?: number;
  logit_bias?: Record<string, number>;
  user?: string;
}
```

### Response Format

```typescript
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
```

### Error Responses

```typescript
{
  error: {
    message: string;
    type: "validation_error" | "authentication_error" | "authorization_error" | 
           "rate_limit_error" | "method_not_allowed" | "internal_error";
  }
}
```

## Usage Tiers

- Free: 100k tokens/month
- Basic: 500k tokens/month
- Pro: 2M tokens/month
- Enterprise: 10M tokens/month

## Development

1. Install dependencies:
```bash
deno cache deps.ts
```

2. Set up environment:
```bash
cp .env.example .env
# Edit .env with your values
```

3. Run locally:
```bash
deno task serve
```

4. Run tests:
```bash
deno task test
```

## Deployment

Deploy to Supabase:
```bash
supabase functions deploy openai-meter --no-verify-jwt
```

## Testing

The function includes comprehensive tests covering:
- Request validation
- Rate limiting
- Subscription validation
- Token counting
- Error handling
- CORS handling

Run tests with:
```bash
deno test --allow-env --allow-net tests/
```

## Security

- All requests require authentication via Bearer token
- Rate limiting per client IP/token
- Subscription validation through Stripe
- Environment variable validation on startup
- CORS origin validation

## Error Handling

- Validation errors: 400
- Authentication errors: 401
- Authorization errors: 403
- Method not allowed: 405
- Rate limit exceeded: 429
- Internal errors: 500

## Architecture

The function is split into modular components:
- `index.ts`: Main entry point and request handling
- `api-contract.ts`: Type definitions and validation
- `env-validator.ts`: Environment configuration
- `openai-proxy.ts`: OpenAI API interaction
- `rate-limiter.ts`: Request throttling
- `stripe-meter.ts`: Usage tracking
- `cors.ts`: CORS handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT