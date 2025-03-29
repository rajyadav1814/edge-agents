# Gemini Tumbler

A service that rotates between different Gemini models and provides anonymous contribution capabilities.

## Features

- **Model Rotation**: Automatically rotates between different Gemini models based on a configurable interval
- **API Key Rotation**: Distributes requests across multiple API keys for higher throughput and reliability
- **Anonymous Contributions**: Allows users to contribute their prompts and responses anonymously for model improvement
- **API Server**: Provides a RESTful API for interacting with the service
- **Configurable**: Easily configure the service through environment variables or configuration files
- **Privacy-Focused**: Implements cryptographic techniques to ensure user privacy

## Getting Started

### Prerequisites

- [Deno](https://deno.land/) 1.30.0 or higher
- Gemini API key(s)

### Installation

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in your API keys
3. Run the service

```bash
# Install dependencies
deno cache --reload src/index.ts

# Start the service
deno task start
```

## Usage

### API Endpoints

- `GET /health`: Health check endpoint
- `GET /models`: Get available models
- `POST /generate`: Generate text from a model
- `GET /anonymous-id`: Generate a new anonymous ID
- `POST /feedback/:id`: Add feedback to a contribution

### Example Request

```bash
curl -X POST http://localhost:3000/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain quantum computing in simple terms",
    "model": "gemini-1.5-pro",
    "temperature": 0.7,
    "maxTokens": 1000,
    "contributionConsent": true
  }'
```

### Example Response

```json
{
  "content": "Quantum computing is like having a super-powered calculator...",
  "model": "gemini-1.5-pro",
  "tokenUsage": {
    "promptTokens": 7,
    "completionTokens": 150,
    "totalTokens": 157
  },
  "processingTime": 1234,
  "id": "response-id-123",
  "timestamp": 1679012345678
}
```

## Multiple API Key Support

Gemini Tumbler supports using multiple API keys to overcome rate limits and improve reliability.

### Benefits of API Key Rotation

- **Higher Throughput**: Distribute requests across multiple keys to handle more traffic
- **Improved Reliability**: Automatic fallback if one key fails or reaches its rate limit
- **Cost Optimization**: Maximize free tier usage across multiple keys before incurring charges
- **Load Balancing**: Even distribution of requests to prevent any single key from being overloaded

### Cost-Benefit Analysis

| Configuration | Requests Per Minute | Daily Requests | Reliability | Cost |
|---------------|---------------------|----------------|-------------|------|
| Single API Key | 15 | 1,500 | Single point of failure | Free tier limit |
| 3 API Keys | 45 | 4,500 | High redundancy | 3x free tier capacity |
| 5 API Keys | 75 | 7,500 | Very high redundancy | 5x free tier capacity |

Using multiple free tier API keys allows you to scale your application without incurring additional costs.

### Setting Up Multiple API Keys

Add your API keys to your `.env` file:

```
# Primary API Key
GEMINI_API_KEY=your_primary_api_key

# Additional API Keys
GEMINI_API_KEY_2=your_second_api_key
GEMINI_API_KEY_3=your_third_api_key
# Add more as needed...
```

The service will automatically detect and use all available API keys.

## Configuration

The service can be configured through environment variables:

- `PORT`: Port to run the server on (default: 3000)
- `GEMINI_API_KEY`: Your primary Gemini API key
- `GEMINI_API_KEY_2`, `GEMINI_API_KEY_3`, etc.: Additional API keys for rotation
- `ROTATION_INTERVAL`: Interval in milliseconds for model rotation (default: 3600000)
- `DEFAULT_MODEL`: Default model to use (default: gemini-1.5-pro)
- `ANONYMOUS_CONTRIBUTION`: Whether to enable anonymous contributions (default: true)
- `CONTRIBUTION_ENDPOINT`: Endpoint to send contributions to (optional)

## Development

### Project Structure

```
src/
├── agent/           # Model clients and tumbler service
├── api/             # API server
├── types/           # TypeScript types
└── utils/           # Utility functions
```

### Running Tests

```bash
deno task test
```

### Linting and Formatting

```bash
# Format code
deno task fmt

# Lint code
deno task lint
```

## Limitations

- Free tier API keys are limited to 15 requests per minute and 1,500 requests per day
- Using multiple keys increases complexity in monitoring and management
- API keys must be properly secured to prevent unauthorized access
- Rate limits may change based on Google's policies

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.