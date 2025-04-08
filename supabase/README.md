# Supabase Edge Functions

This directory contains all edge functions for the Agentic Edge Functions project. Each function is implemented as a serverless Deno function running on Supabase's edge infrastructure.

## Function Categories

### Agent Functions
| Function | Description | Documentation |
|----------|-------------|---------------|
| [agent_alpha](./functions/agent_alpha) | Basic agent implementation with ReAct pattern | [Docs](../docs/agent_functions/agent_alpha.md) |
| [agent_beta](./functions/agent_beta) | Enhanced agent with additional capabilities | [Docs](../docs/agent_functions/agent_beta.md) |
| [agent_stream](./functions/agent_stream) | Streaming response agent | [Docs](../docs/agent_functions/agent_stream.md) |
| [agent_websocket](./functions/agent_websocket) | WebSocket-based agent communication | [Docs](../docs/agent_functions/agent_websocket.md) |
| [agentic_inbox_agent](./functions/agentic_inbox_agent) | Agent for managing message inboxes | [Docs](../docs/agent_functions/agentic_inbox_agent.md) |
| [openai-agent-sdk](./functions/openai-agent-sdk) | OpenAI agent SDK implementation | [Docs](../docs/agent_functions/openai-agent-sdk.md) |

### Management Functions
| Function | Description | Documentation |
|----------|-------------|---------------|
| [agent-manager](./functions/agent-manager) | Orchestration and management of multiple agents | [Docs](../docs/management_functions/agent-manager.md) |
| [edge_deployment](./functions/edge_deployment) | Tools for deploying and managing edge functions | [Docs](../docs/management_functions/edge_deployment.md) |
| [deploy-function](./functions/deploy-function) | Function deployment utilities | [Docs](../docs/management_functions/deploy-function.md) |
| [list-functions](./functions/list-functions) | List available edge functions | [Docs](../docs/management_functions/list-functions.md) |

### Communication Functions
| Function | Description | Documentation |
|----------|-------------|---------------|
| [resend](./functions/resend) | Email communication using Resend API | [Docs](../docs/communication_functions/resend.md) |
| [send-contact-notification](./functions/send-contact-notification) | Contact form notifications | [Docs](../docs/communication_functions/send-contact-notification.md) |

### Integration Functions
| Function | Description | Documentation |
|----------|-------------|---------------|
| [github-api](./functions/github-api) | GitHub API integration | [Docs](../docs/integration_functions/github-api.md) |
| [mcp-server](./functions/mcp-server) | Model Context Protocol server implementation | [Docs](../docs/integration_functions/mcp-server.md) |
| [git-pull-fixer](./functions/git-pull-fixer) | Git pull request automation | [Docs](../docs/integration_functions/git-pull-fixer.md) |
| [stripe_check-subscription-status](./functions/stripe_check-subscription-status) | Subscription status verification | [Docs](../docs/utility_functions/stripe/stripe_check-subscription-status.md) |
| [stripe_create-portal-session](./functions/stripe_create-portal-session) | Stripe customer portal integration | [Docs](../docs/utility_functions/stripe/stripe_create-portal-session.md) |

### Utility Functions
| Function | Description | Documentation |
|----------|-------------|---------------|
| [feedback](./functions/feedback) | User feedback collection | [Docs](../docs/utility_functions/feedback.md) |
| [meta-function-generator](./functions/meta-function-generator) | Dynamic function generation | [Docs](../docs/utility_functions/meta-function-generator.md) |
| [hello-world](./functions/hello-world) | Simple example function | [Docs](../docs/utility_functions/hello-world.md) |
| [test-function](./functions/test-function) | Testing utilities | [Docs](../docs/utility_functions/test-function.md) |
| [env_test](./functions/env_test.ts) | Environment variable validation | [Docs](../docs/utility_functions/env_test.md) |
| [vector-file](./functions/vector-file) | Vector file operations | [Docs](../docs/utility_functions/vector-file.md) |

## Shared Code
| Directory | Description |
|-----------|-------------|
| [_shared](./functions/_shared) | Common utilities and components used by multiple functions |

## Deployment

To deploy an individual edge function:

```bash
# Deploy a specific function
supabase functions deploy hello-world

# Deploy with environment variables
supabase functions deploy hello-world --env-file .env.production

# To verify deployment
supabase functions list
```

For more deployment options and environment configuration, see:
- [Environment Variables Documentation](../docs/environment_variables.md)
- [Deployment Guide](../docs/deployment.md)