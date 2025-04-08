# GitHub Projects API Documentation

Welcome to the documentation for the GitHub Projects API integration edge function. This collection of guides and references will help you effectively implement, use, and troubleshoot the GitHub Projects API integration.

## Documentation Overview

| Document | Description |
|----------|-------------|
| [API Reference](./api-reference.md) | Complete reference of all endpoints, parameters, and response formats |
| [Installation & Setup](./installation-setup.md) | Guide for installing, configuring, and deploying the edge function |
| [Security Best Practices](./security-best-practices.md) | Security recommendations and best practices for using the API |
| [Example Usage](./example-usage.md) | Practical examples with curl commands and response examples |
| [MCP Integration](./mcp-integration.md) | Guide for using the MCP discovery endpoint and integration |
| [Troubleshooting Guide](./troubleshooting-guide.md) | Solutions for common issues and error scenarios |

## Quick Start

1. **Installation**
   
   ```bash
   # Deploy the function to your Supabase project
   supabase functions deploy github-api
   
   # Configure required environment variables
   supabase secrets set GITHUB_TOKEN=your_github_token
   supabase secrets set GITHUB_ORG=your_organization_name
   ```

2. **Basic Usage**

   ```bash
   # List GitHub Projects
   curl -X GET "https://your-project-ref.supabase.co/functions/v1/github-api/projects" \
     -H "Authorization: Bearer your_supabase_anon_key"
   
   # Get a specific project
   curl -X GET "https://your-project-ref.supabase.co/functions/v1/github-api/projects/1" \
     -H "Authorization: Bearer your_supabase_anon_key"
   ```

3. **Next Steps**
   - See the [Installation & Setup](./installation-setup.md) guide for detailed configuration
   - Review the [API Reference](./api-reference.md) for all available endpoints
   - Check the [Example Usage](./example-usage.md) for practical implementation examples

## Key Features

- **REST API Proxy**: Securely proxy requests to GitHub's REST API
- **GraphQL Support**: Execute GraphQL queries against GitHub's GraphQL API
- **Projects API**: Specialized endpoints for GitHub Projects v2
- **Webhook Processing**: Handle and verify GitHub webhooks
- **MCP Integration**: MCP discovery endpoint for tool integration
- **Error Handling**: Robust error handling with detailed error messages
- **Response Formatting**: Standardized response format with metadata
- **Rate Limit Handling**: Intelligent handling of GitHub API rate limits
- **Caching**: Configurable response caching

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes | - |
| `GITHUB_ORG` | GitHub Organization name | Yes | - |
| `GITHUB_API_VERSION` | GitHub API version | No | `v3` |
| `GITHUB_WEBHOOK_SECRET` | Secret for verifying webhook signatures | No | - |
| `CACHE_TTL` | Cache time-to-live in seconds | No | `300` |

## Contributing

If you'd like to contribute to this documentation:

1. Make your changes or additions to the relevant Markdown files
2. Ensure your documentation follows the existing style and format
3. Submit a pull request with a clear description of your changes

## Additional Resources

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)
- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [Supabase Edge Functions Documentation](https://supabase.com/docs/guides/functions)