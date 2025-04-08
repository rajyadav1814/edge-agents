# GitHub API Test Scripts

This directory contains scripts for testing the GitHub API integration.

## Available Scripts

### `test-create-project-v4.sh`

Creates a simple GitHub project using the GraphQL API v4.

```bash
export GITHUB_TOKEN=your_token_here
export GITHUB_ORG=your_org_here
./test-create-project-v4.sh
```

### `create-project-with-tasks.sh`

Creates a GitHub project and adds multiple draft issues as tasks.

```bash
export GITHUB_TOKEN=your_token_here
export GITHUB_ORG=your_org_here
./create-project-with-tasks.sh
```

### `cleanup-test-projects.sh`

Removes test projects from the organization (projects with "Test Project" in the title).

```bash
export GITHUB_TOKEN=your_token_here
export GITHUB_ORG=your_org_here
./cleanup-test-projects.sh
```

### `test-create-project.sh`

Creates a simple GitHub project using the REST API v3.

```bash
export GITHUB_TOKEN=your_token_here
./test-create-project.sh
```

## Usage Notes

1. Make sure to set the `GITHUB_TOKEN` environment variable with a valid GitHub personal access token.
2. The token must have the appropriate permissions:
   - `repo` - For repository access
   - `admin:org` - For organization project access
   - `project` - For project management

3. You can also set the `GITHUB_ORG` environment variable to specify the organization (defaults to "agenticsorg").

## Examples

Run a test to create a project with tasks:

```bash
cd /path/to/scripts/test
export GITHUB_TOKEN=github_pat_your_token_here
./create-project-with-tasks.sh
```

Clean up test projects:

```bash
cd /path/to/scripts/test
export GITHUB_TOKEN=github_pat_your_token_here
./cleanup-test-projects.sh