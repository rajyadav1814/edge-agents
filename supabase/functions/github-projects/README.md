# GitHub Projects MCP Server

This is a modular MCP (Model Context Protocol) server for interacting with GitHub Projects API. It provides tools for managing GitHub repositories, projects, issues, and SSH authentication.

## Modular Structure

The server is organized into a modular structure for better maintainability and extensibility:

```
github-projects/
├── config/             # Configuration management
├── server/             # MCP server initialization
├── services/           # Service implementations
├── tools/              # MCP tool implementations
├── utils/              # Utility functions
├── index.js            # Main entry point
└── mcp-stdio-server.js # Legacy monolithic server (for backward compatibility)
```

### Key Components

- **config/**: Centralizes all configuration settings and environment variables
- **server/**: Handles MCP server initialization and transport
- **services/**: Contains service implementations for different GitHub API domains
- **tools/**: Organizes MCP tools by domain (repository, project, issue, etc.)
- **utils/**: Provides utility functions for GraphQL, REST API, command execution, etc.

## Services

- **ProjectEditService**: Handles editing projects and project items
- **ProjectDeleteService**: Handles deleting projects and project items
- **ProjectFieldService**: Handles updating project field values (like status)
- **GitHubProjectService**: Provides GitHub Projects API functionality
- **GitHubIssueService**: Provides GitHub Issues API functionality
- **GitHubStatusService**: Handles GitHub commit status operations
- **SSHAuthService**: Handles SSH authentication for GitHub

## Tools

Tools are organized by domain:

- **repository-tools.js**: Repository-related tools (getRepository, getRepositoryId)
- **project-tools.js**: Project-related tools (listProjects, getProject, createProject, etc.)
- **issue-tools.js**: Issue-related tools (createIssue, createSubIssue)
- **ssh-tools.js**: SSH authentication tools (addSSHKeyToAgent, generateSSHKey, etc.)
- **graphql-tools.js**: GraphQL-related tools (executeGraphQL)

## Documentation

- [Edit/Delete API](./docs/edit-delete-api.md): Documentation for editing and deleting projects and items
- [Field Update API](./docs/field-update-api.md): Documentation for updating project field values
- [Project Management API](./docs/project-management-api.md): Documentation for project management operations
- [Examples](./docs/examples/): Example code for using the MCP tools

## Usage

### Starting the Server

```bash
# Start the modular server
npm run start:stdio

# Start the legacy monolithic server
npm run start:legacy
```

### Adding New Capabilities

To add new capabilities to the server:

1. Create a new service in the `services/` directory
2. Create a new tool module in the `tools/` directory
3. Register the new tool module in `tools/index.js`
4. Update the service initialization in `services/index.js`

## Environment Variables

- `GITHUB_TOKEN` or `GITHUB_PERSONAL_ACCESS_TOKEN`: GitHub API token (required)
- `GITHUB_ORG`: GitHub organization name (default: 'agenticsorg')
- `GITHUB_API_VERSION`: GitHub API version (default: 'v3')
- `CACHE_TTL`: Cache time-to-live in seconds (default: 300)

## License

MIT
