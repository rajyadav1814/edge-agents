# Getting Started with Agentic Edge Functions

This guide will help you set up and start working with the Agentic Edge Functions repository. Follow these steps to get your development environment configured and deploy your first edge function.

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [Deno](https://deno.land/#installation) (v1.28 or later)
- [Supabase CLI](https://supabase.com/docs/reference/cli/installing-and-updating)
- [Git](https://git-scm.com/downloads)

## Setup Steps

### 1. Clone the Repository

```bash
# Clone the repository
git clone https://github.com/agentics-foundation/edge-agents.git

# Navigate to the project directory
cd edge-agents
```

### 2. Set Up Supabase Project

#### Option 1: Create a New Supabase Project

1. Sign up or log in to [Supabase](https://supabase.com)
2. Create a new project from the Supabase dashboard
3. Note your project URL and API keys

#### Option 2: Use an Existing Supabase Project

If you already have a Supabase project, you can use it with this repository.

### 3. Configure Supabase CLI

Link your local repository to your Supabase project:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref
```

Replace `your-project-ref` with your Supabase project reference ID, which can be found in your project's dashboard URL or settings.

### 4. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Replace the placeholders with your actual Supabase project details.

### 5. Install Dependencies

Some edge functions may require additional dependencies. Check the specific function's documentation for details.

## Running Edge Functions Locally

To run edge functions locally for development and testing:

```bash
# Start the Supabase local development server
supabase start

# Serve all functions
supabase functions serve --no-verify-jwt

# Serve a specific function
supabase functions serve function-name --no-verify-jwt
```

The `--no-verify-jwt` flag allows you to call the functions without authentication during local development.

## Testing Edge Functions

### HTTP Requests

You can test HTTP-based edge functions using curl or any API testing tool:

```bash
# Test a function locally
curl -X POST http://localhost:54321/functions/v1/function-name \
  -H "Content-Type: application/json" \
  -d '{"param1": "value1", "param2": "value2"}'

# Test a deployed function
curl -X POST https://your-project-ref.supabase.co/functions/v1/function-name \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"param1": "value1", "param2": "value2"}'
```

### WebSocket Connections

For WebSocket-based functions, you can use tools like [websocat](https://github.com/vi/websocat) or write a simple client:

```javascript
// Simple WebSocket client
const ws = new WebSocket('wss://your-project-ref.supabase.co/functions/v1/function-name');

ws.onopen = () => {
  console.log('Connected');
  ws.send(JSON.stringify({ message: 'Hello' }));
};

ws.onmessage = (event) => {
  console.log('Received:', event.data);
};

ws.onerror = (error) => {
  console.error('Error:', error);
};

ws.onclose = () => {
  console.log('Disconnected');
};
```

## Deploying Edge Functions

To deploy an edge function to your Supabase project:

```bash
# Deploy a specific function
supabase functions deploy function-name

# Deploy all functions
supabase functions deploy
```

## Setting Environment Variables for Deployed Functions

Set environment variables for your deployed functions:

```bash
# Set a single environment variable
supabase secrets set MY_API_KEY=your-api-key

# Set multiple environment variables
supabase secrets set MY_API_KEY=your-api-key OTHER_SECRET=another-secret

# Set environment variables from a .env file
supabase secrets set --env-file .env
```

## Monitoring and Logs

View logs for your deployed functions:

```bash
# View logs for a specific function
supabase functions logs function-name

# View logs for all functions
supabase functions logs
```

## Common Development Patterns

### 1. Create a New Function

```bash
# Create a new function directory
mkdir -p supabase/functions/new-function

# Create the main function file
touch supabase/functions/new-function/index.ts
```

Edit the `index.ts` file with your function code:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { name } = await req.json();
  
  return new Response(
    JSON.stringify({ message: `Hello, ${name}!` }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

### 2. Test the Function Locally

```bash
# Serve the function locally
supabase functions serve new-function --no-verify-jwt

# Test the function
curl -X POST http://localhost:54321/functions/v1/new-function \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

### 3. Deploy the Function

```bash
# Deploy the function
supabase functions deploy new-function
```

### 4. Test the Deployed Function

```bash
# Test the deployed function
curl -X POST https://your-project-ref.supabase.co/functions/v1/new-function \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-anon-key" \
  -d '{"name": "World"}'
```

## Next Steps

Now that you have set up your development environment and deployed your first function, you can:

1. Explore the [function documentation](./README.md) to learn about the available functions
2. Learn about [Supabase Edge Functions](./supabase_edge_functions.md) in more detail
3. Understand how to use [Real-time Channels](./realtime_channels.md) with your functions
4. Learn about [Secrets Management](./secrets_management.md) for secure credential handling
5. Explore [Database Triggers](./database_triggers.md) for event-driven architectures

## Troubleshooting

### Function Deployment Issues

If you encounter issues deploying functions:

1. Check that your Supabase CLI is up to date:
   ```bash
   npm install -g supabase@latest
   ```

2. Verify that your project is correctly linked:
   ```bash
   supabase projects list
   ```

3. Check for syntax errors in your function code

### Local Development Issues

If you encounter issues with local development:

1. Ensure Deno is installed correctly:
   ```bash
   deno --version
   ```

2. Check that the Supabase local development server is running:
   ```bash
   supabase status
   ```

3. Restart the functions server:
   ```bash
   supabase functions serve --no-verify-jwt
   ```

### Authentication Issues

If you encounter authentication issues:

1. For local development, use the `--no-verify-jwt` flag
2. For deployed functions, ensure you're including the correct authorization header
3. Check that your API keys are correct in your environment variables

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Deno Documentation](https://deno.land/manual)
- [Supabase CLI Reference](https://supabase.com/docs/reference/cli)
- [Supabase Edge Functions Reference](https://supabase.com/docs/reference/edge-functions)

---

Created by rUv, Agentics Foundation founder.