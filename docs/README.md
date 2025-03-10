# Agentic Edge Functions Documentation

Welcome to the comprehensive documentation for the Agentic Edge Functions repository. This documentation provides detailed information about each function, their architecture, deployment options, and usage patterns.

## Documentation Structure

The documentation is organized into the following categories:

### Function Documentation

- [Agent Functions](./agent_functions/) - Documentation for autonomous agent implementations
- [Management Functions](./management_functions/) - Documentation for agent orchestration and management
- [Communication Functions](./communication_functions/) - Documentation for communication capabilities
- [Integration Functions](./integration_functions/) - Documentation for external service integrations
- [Utility Functions](./utility_functions/) - Documentation for utility and helper functions

### Core Concepts

- [Supabase Edge Functions](./supabase_edge_functions.md) - Overview of Supabase Edge Functions
- [Real-time Channels](./realtime_channels.md) - Using Supabase real-time channels
- [Environment Variables](./environment_variables.md) - Comprehensive list of all environment variables
- [Secrets Management](./secrets_management.md) - Best practices for managing secrets
- [Database Triggers](./database_triggers.md) - Using database triggers with edge functions
- [Function Categories](./function_categories.md) - Overview of function categories and structure

### Guides

- [Getting Started](./getting_started.md) - Guide to getting started with the repository
- [Deployment Guide](./deployment.md) - Guide to deploying edge functions
- [Contributing Guidelines](./contributing.md) - Guidelines for contributing to the repository

## Function Index

Below is a complete index of all functions in the repository:

### Agent Functions
- [agent_alpha](./agent_functions/agent_alpha.md) - Basic agent implementation with ReAct pattern
- [agent_beta](./agent_functions/agent_beta.md) - Enhanced agent with additional capabilities
- [agent_stream](./agent_functions/agent_stream.md) - Streaming response agent
- [agent_websocket](./agent_functions/agent_websocket.md) - WebSocket-based agent communication
- [agentic_inbox_agent](./agent_functions/agentic_inbox_agent.md) - Agent for managing message inboxes

### Management Functions
- [agent-manager](./management_functions/agent-manager.md) - Orchestration and management of multiple agents
- [edge_deployment](./management_functions/edge_deployment.md) - Tools for deploying and managing edge functions

### Communication Functions
- [resend](./communication_functions/resend.md) - Email communication using Resend API
- [send-contact-notification](./communication_functions/send-contact-notification.md) - Contact form notifications

### Integration Functions
- [github-api](./integration_functions/github-api.md) - GitHub API integration
- [mcp-server](./integration_functions/mcp-server.md) - Model Context Protocol server implementation

### Utility Functions
- [stripe_check-subscription-status](./utility_functions/stripe/stripe_check-subscription-status.md) - Subscription status verification
- [stripe_create-portal-session](./utility_functions/stripe/stripe_create-portal-session.md) - Stripe customer portal integration
- [feedback](./utility_functions/feedback.md) - User feedback collection
- [meta-function-generator](./utility_functions/meta-function-generator.md) - Dynamic function generation
- [hello-world](./utility_functions/hello-world.md) - Simple example function
- [test-function](./utility_functions/test-function.md) - Testing utilities

## Additional Resources

- [Deno Documentation](https://deno.land/manual)
- [Supabase Documentation](https://supabase.io/docs)
- [Edge Functions API Reference](https://supabase.com/docs/reference/edge-functions)

---

Created by rUv, Agentics Foundation founder.