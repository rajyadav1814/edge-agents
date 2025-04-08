# GitHub API Edge Function

This Supabase Edge Function provides a secure and efficient interface to the GitHub API, allowing you to interact with GitHub repositories, projects, issues, and more.

## Features

- GraphQL API support for efficient data retrieval
- REST API compatibility for specific operations
- Project management (create, read, update, delete)
- Task/issue management within projects
- Repository listing and details
- README content retrieval
- Rate limiting handling
- Error handling and standardized responses
- CORS support for browser clients
- Caching with configurable TTL

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | Yes | - |
| `GITHUB_ORG` | GitHub Organization name | Yes | - |
| `GITHUB_API_VERSION` | GitHub API version | No | `v3` |
| `WEBHOOK_SECRET` | Secret for webhook verification | No | - |
| `CACHE_TTL` | Cache time-to-live in seconds | No | `300` |

## API Endpoints

### REST API Endpoints
- `/github-api/` - List all repositories in the organization
- `/github-api/repo/:repoName` - Get repository details
- `/github-api/readme/:repoName` - Get repository README content
- `/github-api/issues/:repoName` - List issues for a repository
- `/github-api/pulls/:repoName` - List pull requests for a repository
- `/github-api/commits/:repoName` - List commits for a repository
- `/github-api/branches/:repoName` - List branches for a repository
- `/github-api/contents/:repoName/:path` - Get repository contents at path

### GraphQL API Endpoints
- `/github-api/graphql` - GraphQL API endpoint for custom queries

### Projects API Endpoints
- `/github-api/projects/list` - List projects
- `/github-api/projects/detail` - Get project details
- `/github-api/projects/create` - Create a new project
- `/github-api/projects/items` - Get project items
- `/github-api/projects/add-item` - Add item to project
- `/github-api/projects/update-field` - Update project item field

## Testing

The function includes a set of test scripts to verify its functionality:

```bash
# Run unit tests
deno test --allow-env tests/unit/

# Run integration tests
deno test --allow-env --allow-net tests/integration/

# Run manual API tests
cd scripts/test
export GITHUB_TOKEN=your_token_here
./run-all-tests.sh
```

See the [test scripts README](scripts/test/README.md) for more details on the available test scripts.

## Deployment

Deploy the function to Supabase:

```bash
supabase functions deploy github-api --project-ref your-project-ref
```

## Documentation

- [API Reference](docs/api-reference.md)
- [Installation & Setup](docs/installation-setup.md)
- [Example Usage](docs/example-usage.md)
- [Security Best Practices](docs/security-best-practices.md)
- [Troubleshooting Guide](docs/troubleshooting-guide.md)