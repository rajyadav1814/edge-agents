# Gemini Tumbler Architecture

This document outlines the architecture of the Gemini Tumbler project, describing the components, their interactions, and the design decisions.

## System Overview

Gemini Tumbler is a service that provides a rotating model selection mechanism for Gemini API calls, along with anonymous contribution capabilities. The system is designed to be deployed as an edge function, providing low-latency access to Gemini models while optimizing for cost and performance.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                       │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                           API Server                             │
│                                                                 │
│  ┌─────────────┐  ┌────────────┐  ┌───────────┐  ┌───────────┐  │
│  │ Health Check│  │ Model List │  │ Generate  │  │ Feedback  │  │
│  └─────────────┘  └────────────┘  └───────────┘  └───────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Tumbler Service                          │
│                                                                 │
│  ┌─────────────────────┐    ┌───────────────────────────────┐   │
│  │   Model Rotation    │    │    Contribution Manager       │   │
│  └─────────────────────┘    └───────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Model Clients                            │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Gemini Pro     │  │  Gemini Flash   │  │  Custom Models  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Gemini API                               │
└─────────────────────────────────────────────────────────────────┘
```

## Component Descriptions

### 1. API Server

The API Server is the entry point for client applications. It provides a RESTful API for interacting with the tumbler service.

**Key Responsibilities:**
- Handle HTTP requests and responses
- Validate incoming requests
- Route requests to the appropriate service methods
- Handle errors and provide meaningful responses
- Implement middleware for logging, CORS, and security

**Technologies:**
- Oak framework for HTTP server
- JSON for request/response format

### 2. Tumbler Service

The Tumbler Service is the core component that manages model rotation and processes requests.

**Key Responsibilities:**
- Rotate between different models based on configuration
- Route requests to the appropriate model client
- Track usage and performance metrics
- Manage anonymous contributions

**Design Decisions:**
- Configurable rotation interval
- Support for model-specific parameters
- Default model fallback mechanism
- In-memory state with optional persistence

### 3. Model Clients

Model Clients are responsible for interacting with specific model APIs.

**Key Responsibilities:**
- Format requests for specific models
- Handle model-specific parameters
- Process responses
- Handle errors and retries

**Design Decisions:**
- Extensible design to support multiple model providers
- Consistent interface across different models
- Configurable parameters for each model

### 4. Contribution Manager

The Contribution Manager handles anonymous contributions from users.

**Key Responsibilities:**
- Securely store contributions
- Anonymize user data
- Collect feedback on contributions
- Provide contribution data for model improvement

**Design Decisions:**
- Privacy-first approach with cryptographic techniques
- Opt-in contribution system
- Feedback collection mechanism
- Configurable storage options

## Data Flow

1. **Request Processing:**
   - Client sends a request to the API Server
   - API Server validates the request
   - Tumbler Service selects the appropriate model
   - Model Client formats and sends the request to the Gemini API
   - Response is processed and returned to the client

2. **Model Rotation:**
   - Tumbler Service maintains a timer for rotation
   - When the timer expires, the service rotates to the next model
   - Subsequent requests use the new model unless overridden

3. **Anonymous Contribution:**
   - Client includes contribution consent in the request
   - Tumbler Service processes the request normally
   - If consent is given, the prompt and response are anonymized
   - Contribution Manager stores the anonymized data
   - Client can later provide feedback on the contribution

## Security Considerations

### Authentication and Authorization

- API keys for service access
- Environment variable-based configuration for sensitive data
- No persistent storage of API keys

### Data Privacy

- Cryptographic techniques for anonymizing contributions
- Hashing of sensitive data
- No storage of personally identifiable information
- Opt-in contribution system

### Edge Function Security

- Minimal attack surface
- Stateless design where possible
- Proper error handling to prevent information leakage

## Performance Considerations

### Edge Deployment Optimization

- Minimal dependencies to reduce bundle size
- Efficient code to minimize cold start times
- Caching strategies for frequently used data

### Scalability

- Stateless design for horizontal scaling
- Configurable parameters for different load profiles
- Efficient resource utilization

## Monitoring and Observability

- Structured logging for all operations
- Performance metrics collection
- Error tracking and reporting
- Health check endpoint for monitoring

## Configuration Management

- Environment variable-based configuration
- Default values for all configuration options
- Runtime configuration updates where appropriate
- Configuration validation on startup

## Testing Strategy

### Unit Testing

- Comprehensive test coverage for all components
- Mock external dependencies
- Test error scenarios and edge cases

### Integration Testing

- Test component interactions
- Verify end-to-end functionality
- Test with realistic data

### Performance Testing

- Measure response times
- Evaluate cold start performance
- Test under various load conditions

## Deployment Strategy

### Edge Function Deployment

- Optimize for edge runtime environment
- Minimize cold start time
- Reduce bundle size
- Support for multiple edge platforms

### CI/CD Pipeline

- Automated testing
- Deployment scripts
- Version management
- Environment-specific configuration

## Future Extensions

- Support for additional model providers
- Advanced rotation strategies (e.g., based on performance or cost)
- Enhanced contribution analysis tools
- Real-time performance monitoring and adaptation
- Integration with model fine-tuning pipelines