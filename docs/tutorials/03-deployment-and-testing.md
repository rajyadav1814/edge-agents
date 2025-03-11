# Deploying and Testing Edge Functions

This tutorial will guide you through deploying and testing your edge functions, both with and without JWT authentication. You'll learn how to deploy your functions to Supabase, test them locally and in production, and secure them with JWT authentication.

## Prerequisites

Before starting, make sure you have:

1. Completed the previous tutorials:
   - [Creating Your First Edge Function](./01-first-edge-function.md)
   - [Building a Basic Agentic Function](./02-basic-agentic-function.md)
2. [Supabase CLI](https://supabase.com/docs/reference/cli/installing-and-updating) installed
3. A Supabase project set up

## Deploying Edge Functions

### Step 1: Prepare Your Function for Deployment

Before deploying, make sure your function is ready:

1. Test it locally to ensure it works as expected
2. Set up any required environment variables
3. Make sure your function has proper error handling

### Step 2: Deploy Your Function

To deploy your function to Supabase, use the following command:

```bash
# Deploy a specific function
supabase functions deploy hello-world

# Deploy all functions
supabase functions deploy
```

This will deploy your function to your Supabase project, making it available at:
`https://<your-project-ref>.supabase.co/functions/v1/hello-world`

### Step 3: Set Environment Variables

If your function requires environment variables (like API keys), you can set them using the Supabase CLI:

```bash
# Set a single environment variable
supabase secrets set OPENROUTER_API_KEY=your-openrouter-api-key

# Set multiple environment variables from a .env file
supabase secrets set --env-file .env.production
```

## Testing Edge Functions

### Local Testing

You can test your functions locally before deploying them:

```bash
# Start the Supabase local development environment
supabase start

# Serve a specific function
supabase functions serve hello-world --env-file .env.local

# Serve all functions
supabase functions serve --env-file .env.local
```

Then test your function using `curl` or any HTTP client:

```bash
# Test a GET request
curl http://localhost:54321/functions/v1/hello-world

# Test a POST request with JSON data
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}' \
  http://localhost:54321/functions/v1/hello-world
```

### Production Testing

After deploying, you can test your function in production:

```bash
# Test a GET request
curl https://<your-project-ref>.supabase.co/functions/v1/hello-world

# Test a POST request with JSON data
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}' \
  https://<your-project-ref>.supabase.co/functions/v1/hello-world
```

## Authentication with JWT

By default, Supabase Edge Functions are publicly accessible. However, you can secure them with JWT authentication.

### Step 1: Enable JWT Verification

To enable JWT verification for your function, add the following code at the beginning of your function:

```typescript
// Verify JWT
const authHeader = req.headers.get('Authorization')
if (!authHeader) {
  return new Response(
    JSON.stringify({ error: 'Missing Authorization header' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}

// Extract the token
const token = authHeader.replace('Bearer ', '')

// Verify the JWT (this is a simplified example)
try {
  // In a real implementation, you would verify the JWT signature
  // using the Supabase JWT verification libraries
  const payload = await verifyJWT(token)
  
  // You can access user information from the payload
  const userId = payload.sub
  
  // Continue processing the request...
} catch (error) {
  return new Response(
    JSON.stringify({ error: 'Invalid token' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}
```

### Step 2: Implement JWT Verification

For proper JWT verification, you can use the Supabase JWT verification utilities:

```typescript
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Verify the JWT using the Supabase client
const { data: { user }, error } = await supabase.auth.getUser(token)

if (error || !user) {
  return new Response(
    JSON.stringify({ error: 'Invalid token' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}

// User is authenticated, continue processing the request
const userId = user.id
```

### Step 3: Test with JWT Authentication

To test your function with JWT authentication, you need to include the JWT token in the request:

```bash
# Get a JWT token by signing in
TOKEN=$(curl -X POST 'https://<your-project-ref>.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: <your-anon-key>' \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"password"}' | jq -r '.access_token')

# Test the function with the JWT token
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}' \
  https://<your-project-ref>.supabase.co/functions/v1/hello-world
```

## Testing Without JWT Authentication

If you want to allow public access to your function (without JWT authentication), you can skip the JWT verification step. This is useful for functions that don't need authentication, such as public APIs or webhooks.

### Option 1: No Authentication

Simply don't include any JWT verification code in your function. This makes the function publicly accessible.

### Option 2: Optional Authentication

You can make authentication optional by checking for the presence of the Authorization header but not requiring it:

```typescript
// Check for optional authentication
const authHeader = req.headers.get('Authorization')
let userId = null

if (authHeader) {
  try {
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (!error && user) {
      userId = user.id
    }
  } catch (error) {
    console.error('Error verifying token:', error)
  }
}

// Continue processing the request, with or without authentication
// You can use userId to provide different behavior for authenticated users
```

### Option 3: API Key Authentication

For functions that need to be called by external services (like webhooks), you can use API key authentication instead of JWT:

```typescript
// Verify API key
const apiKey = req.headers.get('x-api-key')
if (!apiKey || apiKey !== Deno.env.get('API_KEY')) {
  return new Response(
    JSON.stringify({ error: 'Invalid API key' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  )
}

// API key is valid, continue processing the request
```

Then test your function with the API key:

```bash
curl -X POST \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}' \
  https://<your-project-ref>.supabase.co/functions/v1/hello-world
```

## Best Practices for Deployment and Testing

### Environment Variables

- Never hardcode sensitive information (API keys, secrets) in your code
- Use environment variables for configuration
- Use different environment variables for development and production

```typescript
// Good: Use environment variables
const apiKey = Deno.env.get('API_KEY')

// Bad: Hardcoded secrets
const apiKey = 'sk_live_1234567890'
```

### Error Handling

- Always include proper error handling in your functions
- Return appropriate HTTP status codes and error messages
- Log errors for debugging

```typescript
try {
  // Function logic here
} catch (error) {
  console.error('Error:', error)
  
  return new Response(
    JSON.stringify({ error: 'Something went wrong' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  )
}
```

### Testing

- Test your functions locally before deploying
- Test with different inputs and edge cases
- Test both success and error scenarios

### Security

- Use JWT authentication for functions that access user data
- Validate and sanitize all inputs
- Implement rate limiting for public functions

## Conclusion

You've now learned how to deploy and test your edge functions, both with and without JWT authentication. You can use these techniques to deploy your own edge functions to Supabase and make them available to your users.

For more information, check out the [Supabase Edge Functions documentation](https://supabase.com/docs/guides/functions).

---

[Back to Tutorials](./README.md)