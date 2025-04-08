# Mastra AI Agent Documentation

Welcome to the Mastra AI Agent documentation. This guide provides comprehensive information about setting up, using, and extending the Mastra AI agent Supabase Edge Function.

## Documentation Index

### Core Documentation

- [Main README](../README.md) - Overview, features, and architecture
- [Setup Guide](setup-guide.md) - Detailed installation and configuration instructions
- [API Reference](api-reference.md) - Complete API documentation
- [Extending with Tools](extending-with-tools.md) - Guide to adding custom tools
- [Troubleshooting](troubleshooting.md) - Solutions for common issues

## Quick Start

To get started with the Mastra AI agent:

1. **Setup**: Follow the [Setup Guide](setup-guide.md) to install and configure the agent
2. **Deploy**: Deploy the agent to Supabase using the instructions in the [Main README](../README.md#deployment)
3. **Use**: Make API requests as described in the [API Reference](api-reference.md)
4. **Extend**: Add custom tools following the [Extending with Tools](extending-with-tools.md) guide

## Key Features

- **AI-Powered Responses**: Generate intelligent, contextual responses to user queries
- **Extensible Tool System**: Add custom capabilities through a modular tool architecture
- **Conversation Context**: Maintain conversation history for contextual interactions
- **Secure Authentication**: Built-in token-based authentication
- **CORS Support**: Cross-Origin Resource Sharing for web application integration

## Example Usage

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the weather in New York?"}'
```

## Contributing

Contributions to the Mastra AI agent are welcome! Please feel free to submit issues or pull requests to improve the agent or its documentation.

## License

This project is licensed under the [MIT License](../LICENSE).