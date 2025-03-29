# Gemini Tumbler

A service for anonymizing user data and rotating between different Gemini AI models with 90%+ cost reduction.

## Introduction

Gemini Tumbler is a privacy-focused service that provides two key capabilities:

1. **Model Rotation**: Automatically rotates between different Gemini AI models to optimize for cost, performance, and capability requirements.

2. **User Anonymization**: Implements a robust, daisy-chained system for user data obfuscation to enhance privacy and security.

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

- **Automatic Model Switching**: Rotates between models based on configurable intervals
- **Capability-Based Routing**: Routes requests to models based on required capabilities
- **Load Balancing**: Distributes requests across multiple API keys to avoid rate limits
- **Fallback Mechanisms**: Automatically falls back to alternative models if primary models are unavailable
- **Multi-Key Support**: Manages multiple API keys per service to maximize free tier usage
- **Smart Rate Limiting**: Auto-detects API rate limits and dynamically adjusts request distribution

### Auto-Rate Limiting Detection

- **Intelligent Detection**: Automatically identifies rate limiting patterns across different providers
- **Multi-Signal Analysis**: Detects rate limits through status codes, headers, and response timing
- **Dynamic Adaptation**: Adjusts request rates in real-time based on observed limits
- **Health Scoring**: Maintains health scores for each API key to optimize distribution
- **Multiple Distribution Strategies**: Supports round-robin, health-aware, and least-utilized routing
- **Self-Healing**: Automatically recovers from rate limiting incidents
- **Cross-Provider Support**: Works with Google AI, OpenAI, Anthropic, and other providers
- **Zero Configuration**: No need to manually configure rate limits for each provider

### User Anonymization

- **Multi-Stage Privacy**: Implements a daisy chain with Supabase Edge Functions and Cloudflare Workers for enhanced privacy
- **Configurable Anonymization**: Control which user data gets anonymized (ID, IP, geolocation, user agent)
- **One-Way Hashing**: Uses SHA-256 with salt for secure, non-reversible anonymization
- **Data Isolation**: Each function in the chain has limited access to sensitive data
- **Cross-Platform Separation**: Distributes processing across Supabase and Cloudflare for enhanced security
- **Audit Trail**: Each step in the chain can be independently logged and audited

## Benefits

### Privacy Benefits

- **Enhanced User Privacy**: Sensitive user data is anonymized before processing
- **Regulatory Compliance**: Helps meet GDPR, CCPA, and other privacy regulations
- **Reduced Data Liability**: Minimizes the risk of sensitive data exposure
- **Separation of Concerns**: Processing and storage are separated from user identification
- **Defense in Depth**: Multiple layers of privacy protection through the daisy chain

### Cost Benefits (90%+ Reduction)

- **Free Tier Maximization**: Strategically uses free tiers across multiple providers
- **Multiple API Key Management**: Pools free API keys from multiple accounts to increase limits
- **Cross-Provider Distribution**: Each function runs on a different provider's free tier
- **Optimized API Usage**: Routes requests to the most cost-effective model for each task
- **Serverless Pay-Per-Use**: Zero costs when not in use, no idle server expenses
- **Adaptive Rate Limiting**: Automatically optimizes request rates to maximize throughput while avoiding penalties

#### Cost Savings Calculation (90%+ Reduction)

##### Free Gemini API Capabilities

- **Free Tier Access**: Google AI offers generous free tier access to Gemini models
- **60 Requests Per Minute**: Each free API key can process up to 60 requests per minute
- **Daily Quota**: Up to 86,400 free requests per day per API key
- **Multiple Models**: Access to Gemini 1.0 Pro, Gemini 1.5 Flash, and other models
- **Full Feature Access**: Free tier includes all core capabilities

##### Free Serverless Providers

- **Supabase Edge Functions**: 500,000 invocations and 100GB bandwidth free per month
- **Deno Deploy**: 100,000 requests per day on the free tier
- **Netlify Functions**: 125,000 requests per month free
- **Vercel Serverless Functions**: 100GB-hours of execution time free per month
- **Cloudflare Workers**: 100,000 requests per day free

By leveraging free tiers across multiple services and API keys, Gemini Tumbler achieves over 90% cost reduction:

| Usage Level | Traditional Approach | Gemini Tumbler Approach | Monthly Savings |
|-------------|---------------------|-------------------------|----------------|
| 100K requests | $50 | $0 (free tier) | $50 (100%) |
| 500K requests | $250 | $0 (multiple free keys) | $250 (100%) |
| 1M requests | $500 | $25 (95% reduction) | $475 (95%) |
| 5M requests | $2,500 | $150 (94% reduction) | $2,350 (94%) |
| 10M requests | $5,000 | $400 (92% reduction) | $4,600 (92%) |

**Example**: A startup using 10 free Google AI API keys (each with 60 requests/minute) can process up to 864,000 requests per day at zero cost, compared to approximately $1,300/month using a traditional approach.

**Enterprise Savings**: For enterprise-level usage (10M+ requests/month), the cost savings remain above 90%, representing hundreds of thousands of dollars in annual savings.

### Technical Benefits

- **Lightweight Implementation**: Built on Deno for fast, secure execution
- **Multi-Platform Deployment**: Supports deployment to both Supabase Edge Functions and Cloudflare Workers
- **Comprehensive Testing**: Includes tests for all components
- **Extensible Architecture**: Easy to add new models or anonymization techniques
- **Minimal Dependencies**: Uses standard libraries to minimize security risks
- **Self-Optimizing**: Automatically adapts to changing API provider policies and limits
- **Global Edge Network**: Leverages Cloudflare's worldwide edge network for low-latency processing


## Capabilities

### Anonymization Capabilities

- **User ID Obfuscation**: Anonymizes user identifiers
- **IP Address Anonymization**: Hides user IP addresses
- **Geolocation Privacy**: Removes or obfuscates user location data
- **User Agent Masking**: Prevents device and browser fingerprinting
- **Configurable Fields**: Control which data gets anonymized
- **Preservation of Non-Sensitive Data**: Maintains useful non-identifying information

### Model Capabilities

- **Text Generation**: Access to Gemini's text generation capabilities
- **Code Generation**: Specialized models for code-related tasks
- **Reasoning**: Models optimized for complex reasoning tasks
- **Math**: Specialized capabilities for mathematical problems
- **Fast Responses**: Models optimized for low-latency requirements
- **Summarization**: Models specialized in content summarization

## Usage Examples

### Journalism and Whistleblowing

Journalists and news organizations can use Gemini Tumbler to:
- Protect the identity of sources when processing sensitive documents
- Analyze leaked datasets without exposing whistleblower identities
- Create secure communication channels between journalists and sources
- Process potentially controversial content without revealing who requested the analysis

**Example**: A news organization could deploy Gemini Tumbler to allow whistleblowers to submit documents that are processed by AI for relevance and authenticity, while maintaining complete anonymity of the source.

### Political Campaigns and Activism

Political organizations can leverage Gemini Tumbler to:
- Protect supporter identities in regions with political persecution
- Analyze sensitive polling data without exposing individual respondents
- Process strategy documents without attribution to specific team members
- Enable anonymous feedback within campaign organizations

**Example**: An activist group operating in a restrictive political environment could use Gemini Tumbler to process strategy documents and communications while protecting the identities of contributors from potential surveillance.

### Legal and Compliance

Legal professionals can utilize Gemini Tumbler for:
- Processing client data while maintaining attorney-client privilege
- Analyzing case documents without exposing who accessed specific information
- Enabling anonymous reporting of compliance violations
- Conducting internal investigations with enhanced privacy

**Example**: A law firm could implement Gemini Tumbler to allow employees to anonymously report potential ethics violations, with the system processing and categorizing reports without revealing the reporter's identity.

### Healthcare Research

Medical researchers can benefit from Gemini Tumbler by:
- Processing patient data while maintaining HIPAA compliance
- Analyzing sensitive health information without exposing individual identities
- Enabling anonymous participation in research studies
- Securely processing genetic or other highly personal data

**Example**: A research institution could use Gemini Tumbler to process patient data for AI analysis while ensuring that no individual patient can be identified from the processed results.

## Future Development

Check our [plans directory](./plans/) for upcoming features, including:

- **Cloudflare Integration**: Enhanced privacy through Cloudflare Workers (now available in [plans/cloudflare-integration.md](./plans/cloudflare-integration.md))
- **Enhanced Rate Limit Prediction**: Machine learning-based prediction of rate limits before they occur
- **Enhanced Anonymization Techniques**: Additional privacy-preserving methods
- **Cross-Model Fallback Chains**: Automatically route requests to alternative models when primary ones are unavailable
- **Federated Processing**: Distribute processing across multiple endpoints for enhanced privacy

## Getting Started

See the [documentation](./docs/) for detailed setup and usage instructions.

## License

[MIT License](LICENSE)