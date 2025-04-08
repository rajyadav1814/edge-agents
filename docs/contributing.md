# Contributing Guidelines

Thank you for your interest in contributing to the Agentic Edge Functions repository! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Documentation Guidelines](#documentation-guidelines)
- [Testing Guidelines](#testing-guidelines)
- [Security Guidelines](#security-guidelines)
- [Community](#community)

## Code of Conduct

This project adheres to a Code of Conduct that all contributors are expected to follow. Please read and understand it before contributing.

- Be respectful and inclusive
- Value different viewpoints and experiences
- Give and gracefully accept constructive feedback
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [Deno](https://deno.land/#installation) (v1.28 or later)
- [Supabase CLI](https://supabase.com/docs/reference/cli/installing-and-updating)
- [Git](https://git-scm.com/downloads)

### Setting Up the Development Environment

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/your-username/edge-agents.git
   cd edge-agents
   ```
3. Add the original repository as an upstream remote:
   ```bash
   git remote add upstream https://github.com/agentics-foundation/edge-agents.git
   ```
4. Set up the development environment:
   ```bash
   # Install Supabase CLI
   npm install -g supabase

   # Start Supabase local development
   supabase start
   ```

## Development Workflow

### Branching Strategy

We follow a simplified Git workflow:

- `main` - The main branch containing stable code
- `feature/*` - Feature branches for new features or enhancements
- `bugfix/*` - Bugfix branches for bug fixes
- `docs/*` - Documentation branches for documentation changes

### Creating a New Feature or Fix

1. Ensure your fork is up to date:
   ```bash
   git checkout main
   git pull upstream main
   ```

2. Create a new branch:
   ```bash
   # For a new feature
   git checkout -b feature/your-feature-name

   # For a bug fix
   git checkout -b bugfix/issue-number-description

   # For documentation changes
   git checkout -b docs/what-you-are-documenting
   ```

3. Make your changes, following the [coding standards](#coding-standards)

4. Test your changes locally:
   ```bash
   # Serve the functions locally
   supabase functions serve --no-verify-jwt
   ```

5. Commit your changes:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   ```

6. Push your changes to your fork:
   ```bash
   git push origin your-branch-name
   ```

## Pull Request Process

1. Create a pull request from your branch to the main repository's `main` branch
2. Fill in the pull request template with all required information
3. Ensure all checks pass (linting, tests, etc.)
4. Request a review from a maintainer
5. Address any feedback or requested changes
6. Once approved, a maintainer will merge your pull request

### Pull Request Template

When creating a pull request, please include:

- A clear and descriptive title
- A detailed description of the changes
- References to any related issues
- Screenshots or examples if applicable
- Any breaking changes or dependencies
- Testing steps or considerations

## Coding Standards

### TypeScript/JavaScript Style Guide

We follow a consistent coding style across the project:

- Use TypeScript for all new code
- Follow the [Deno Style Guide](https://deno.land/manual/contributing/style_guide)
- Use 2 spaces for indentation
- Use semicolons at the end of statements
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_CASE for constants

### Example

```typescript
// Good example
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const MAX_RETRIES = 3;

interface UserData {
  id: string;
  name: string;
  email: string;
}

class UserService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getUser(id: string): Promise<UserData> {
    const response = await fetch(`${this.baseUrl}/users/${id}`);
    return response.json();
  }
}

serve(async (req) => {
  const { id } = await req.json();
  const userService = new UserService('https://api.example.com');
  
  try {
    const user = await userService.getUser(id);
    return new Response(JSON.stringify(user), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

### Code Quality

- Write self-documenting code with clear variable and function names
- Keep functions small and focused on a single responsibility
- Avoid deep nesting of conditionals and loops
- Use early returns to reduce nesting
- Handle errors appropriately
- Add comments for complex logic, but prefer readable code over excessive comments

## Documentation Guidelines

Good documentation is crucial for the project's usability and maintainability.

### Function Documentation

Each edge function should include:

1. A README.md file in the function directory explaining:
   - Purpose of the function
   - Input parameters and expected format
   - Response format
   - Example usage
   - Any dependencies or requirements

2. Code comments for complex logic

3. TypeScript types/interfaces for all inputs and outputs

### Example Function Documentation

```markdown
# User Authentication Function

This function handles user authentication using JWT tokens.

## Input

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

## Output

Success (200):
```json
{
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  }
}
```

Error (401):
```json
{
  "error": "Invalid credentials"
}
```

## Usage Example

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/auth \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

## Environment Variables

- `JWT_SECRET`: Secret key for signing JWT tokens
```

## Testing Guidelines

### Types of Tests

We encourage writing different types of tests:

1. **Unit Tests**: Test individual functions or components in isolation
2. **Integration Tests**: Test interactions between components
3. **End-to-End Tests**: Test complete workflows

### Writing Tests

For Deno functions, use the built-in testing framework:

```typescript
// user_service_test.ts
import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { UserService } from './user_service.ts';

Deno.test('UserService.getUser returns user data', async () => {
  // Mock fetch
  globalThis.fetch = async (url: string) => {
    return {
      json: async () => ({ id: '123', name: 'Test User', email: 'test@example.com' })
    } as Response;
  };
  
  const userService = new UserService('https://api.example.com');
  const user = await userService.getUser('123');
  
  assertEquals(user.id, '123');
  assertEquals(user.name, 'Test User');
  assertEquals(user.email, 'test@example.com');
});
```

### Running Tests

```bash
# Run all tests
deno test

# Run tests with coverage
deno test --coverage

# Run a specific test file
deno test user_service_test.ts
```

## Security Guidelines

Security is a top priority for this project. Please follow these guidelines:

### General Security Practices

- Never hardcode sensitive information (API keys, passwords, etc.)
- Use environment variables for all secrets
- Validate and sanitize all user inputs
- Implement proper authentication and authorization
- Follow the principle of least privilege
- Keep dependencies up to date

### Reporting Security Issues

If you discover a security vulnerability, please do NOT open an issue. Instead, email security@agentics.org with details about the vulnerability.

## Community

### Communication Channels

- GitHub Issues: For bug reports, feature requests, and discussions
- Discord: For real-time communication and community support
- Email: For private communications and security issues

### Recognition

All contributors will be recognized in the project's contributors list. We value and appreciate all contributions, whether they're code, documentation, bug reports, or feature suggestions.

---

Created by rUv, Agentics Foundation founder.