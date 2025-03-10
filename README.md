# Agentic Edge Functions

Welcome to the Agentic Edge Functions repository by the Agentics Foundation. This open-source project serves as the technological foundation for distributed autonomous AI agents operating at the edge of networks.

## What are Agentic Edge Functions?

Agentic Edge Functions combine serverless edge computing with autonomous AI capabilities. Running at the network edge, these functions enable AI agents to:

- Operate independently near users for lower latency
- Communicate securely with other agents and systems
- Access controlled resources via defined interfaces
- Scale dynamically based on workload requirements

This infrastructure powers the Agentic Dashboard and Agentic Inbox systems at [agentics.org/dashboard](https://agentics.org/dashboard) and is being actively developed in the open, welcoming community contributions.

## Overview

This repository contains edge functions implementing various patterns for autonomous agent deployment and operation. Built on Supabase's serverless infrastructure and Deno runtime, these functions enable scalable, efficient, and globally distributed agent capabilities.

## What are Edge Functions?

Edge functions are serverless functions running at network edges, providing low-latency, high-availability compute without server management. Supabase Edge Functions use Deno, a modern secure JavaScript/TypeScript runtime with built-in security features.

### Why Deno?

[Deno](https://deno.land/) is a modern, secure runtime for JavaScript and TypeScript that provides several advantages:

- **Security-first design**: Explicit permissions for file, network, and environment access
- **Built-in TypeScript support**: No configuration needed
- **Modern JavaScript**: Support for ES modules, top-level await, and more
- **Standard library**: Comprehensive, reviewed standard modules
- **Single executable**: No dependency management headaches

## Function Categories

Our edge functions fall into several categories:

### Agent Functions
- [agent_alpha](./docs/agent_functions/agent_alpha.md) - Basic agent implementation with ReAct pattern
- [agent_beta](./docs/agent_functions/agent_beta.md) - Enhanced agent with additional capabilities
- [agent_stream](./docs/agent_functions/agent_stream.md) - Streaming response agent
- [agent_websocket](./docs/agent_functions/agent_websocket.md) - WebSocket-based agent communication
- [agentic_inbox_agent](./docs/agent_functions/agentic_inbox_agent.md) - Agent for managing message inboxes

### Management Functions
- [agent-manager](./docs/management_functions/agent-manager.md) - Orchestration and management of multiple agents
- [edge_deployment](./docs/management_functions/edge_deployment.md) - Tools for deploying and managing edge functions

### Communication Functions
- [resend](./docs/communication_functions/resend.md) - Email communication using Resend API
- [send-contact-notification](./docs/communication_functions/send-contact-notification.md) - Contact form notifications

### Integration Functions
- [github-api](./docs/integration_functions/github-api.md) - GitHub API integration
- [mcp-server](./docs/integration_functions/mcp-server.md) - Model Context Protocol server implementation

### Utility Functions
- [stripe_check-subscription-status](./docs/utility_functions/stripe/stripe_check-subscription-status.md) - Subscription status verification
- [stripe_create-portal-session](./docs/utility_functions/stripe/stripe_create-portal-session.md) - Stripe customer portal integration
- [feedback](./docs/utility_functions/feedback.md) - User feedback collection
- [meta-function-generator](./docs/utility_functions/meta-function-generator.md) - Dynamic function generation
- [hello-world](./docs/utility_functions/hello-world.md) - Simple example function
- [test-function](./docs/utility_functions/test-function.md) - Testing utilities

## Key Features

- **Real-time Communication**: Agents can communicate in real-time using Supabase's real-time channels
- **Database Integration**: Seamless integration with Supabase PostgreSQL database
- **Secure Secrets Management**: Environment variables for secure credential management
- **Scalable Architecture**: Functions scale automatically with demand
- **Global Distribution**: Deploy functions globally for low-latency responses

## Getting Started

To get started with these edge functions:

1. Clone this repository
2. Set up a Supabase project
3. Configure environment variables
4. Deploy functions to your Supabase project

For detailed instructions, see the [Getting Started Guide](./docs/getting_started.md).

## Documentation

Comprehensive documentation is available in the [docs](./docs) directory:

- [Function Documentation](./docs/README.md) - Detailed documentation for each function
- [Supabase Edge Functions](./docs/supabase_edge_functions.md) - Overview of Supabase Edge Functions
- [Real-time Channels](./docs/realtime_channels.md) - Using Supabase real-time channels
- [Environment Variables](./docs/environment_variables.md) - Comprehensive list of all environment variables
- [Secrets Management](./docs/secrets_management.md) - Best practices for managing secrets
- [Database Triggers](./docs/database_triggers.md) - Using database triggers with edge functions
- [Deployment Guide](./docs/deployment.md) - Deploying edge functions to production

## Contributing

Contributions are welcome! Please see our [Contributing Guidelines](./docs/contributing.md) for more information.

## License

This project is licensed under the terms of the license included in the repository.

---

Created by rUv, Agentics Foundation founder.