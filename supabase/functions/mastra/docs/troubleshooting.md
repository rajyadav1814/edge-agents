# Mastra AI Agent Troubleshooting Guide

This guide provides solutions for common issues you might encounter when working with the Mastra AI agent Supabase Edge Function.

## Table of Contents

1. [Installation and Setup Issues](#installation-and-setup-issues)
2. [Authentication Problems](#authentication-problems)
3. [API Request Issues](#api-request-issues)
4. [Tool Execution Errors](#tool-execution-errors)
5. [Deployment Challenges](#deployment-challenges)
6. [Performance Concerns](#performance-concerns)
7. [Environment Variable Problems](#environment-variable-problems)
8. [Debugging Techniques](#debugging-techniques)

## Installation and Setup Issues

### Deno Installation Problems

**Issue**: Unable to install or run Deno.

**Solution**:
1. Verify your Deno installation:
   ```bash
   deno --version
   ```
2. If not installed or outdated, install or update Deno:
   ```bash
   # Linux/macOS
   curl -fsSL https://deno.land/x/install/install.sh | sh
   
   # Windows (PowerShell)
   iwr https://deno.land/x/install/install.ps1 -useb | iex
   ```
3. Ensure Deno is in your PATH.

### Supabase CLI Issues

**Issue**: Supabase CLI commands fail or aren't recognized.

**Solution**:
1. Verify your Supabase CLI installation:
   ```bash
   supabase --version
   ```
2. If not installed or outdated, install or update the Supabase CLI:
   ```bash
   npm install -g supabase
   ```
3. Ensure you're logged in to Supabase:
   ```bash
   supabase login
   ```

### Project Structure Issues

**Issue**: Files not found or incorrect project structure.

**Solution**:
1. Verify your project structure matches the expected layout:
   ```
   supabase/
   └── functions/
       └── mastra/
           ├── index.ts
           ├── tools/
           ├── middleware/
           ├── config/
           ├── types/
           └── ...
   ```
2. Check for typos in file paths or imports.
3. Ensure all required files are present.

## Authentication Problems

### Missing or Invalid Token

**Issue**: Receiving `401 Unauthorized` responses.

**Solution**:
1. Verify that the `AUTH_TOKEN` environment variable is set:
   ```bash
   # For local development
   grep AUTH_TOKEN .env
   
   # For deployed functions
   supabase secrets list | grep AUTH_TOKEN
   ```
2. Ensure your request includes the correct Authorization header:
   ```
   Authorization: Bearer your-secret-token
   ```
3. Check for whitespace or special characters in your token.

### CORS Issues

**Issue**: Browser applications receive CORS errors.

**Solution**:
1. Ensure your request includes the appropriate headers:
   ```
   Content-Type: application/json
   ```
2. For preflight requests, the function should handle OPTIONS requests correctly.
3. If you need to restrict CORS to specific origins, modify the `corsHeaders` in `middleware/cors.ts`:
   ```typescript
   export const corsHeaders = {
     "Access-Control-Allow-Origin": "https://your-domain.com",
     // Other headers...
   };
   ```

## API Request Issues

### Invalid Request Format

**Issue**: Receiving `400 Bad Request` responses.

**Solution**:
1. Verify your request body format:
   ```json
   {
     "query": "Your question here"
   }
   ```
2. Ensure the `query` field is present and not empty.
3. Check that your JSON is valid with no syntax errors.

### Method Not Allowed

**Issue**: Receiving `405 Method Not Allowed` responses.

**Solution**:
1. Use POST method for all requests:
   ```bash
   curl -X POST https://your-project-ref.supabase.co/functions/v1/mastra \
     -H "Authorization: Bearer your-secret-token" \
     -H "Content-Type: application/json" \
     -d '{"query":"Hello"}'
   ```
2. The function only supports POST requests.

### Response Parsing Errors

**Issue**: Unable to parse the response from the API.

**Solution**:
1. Verify that your client is correctly handling JSON responses.
2. Check for unexpected characters or encoding issues.
3. Ensure you're reading the response body correctly:
   ```javascript
   // JavaScript example
   const response = await fetch(url, options);
   const data = await response.json();
   ```

## Tool Execution Errors

### Weather Tool Failures

**Issue**: Weather-related queries fail or return mock data.

**Solution**:
1. Verify that the `WEATHER_API_KEY` environment variable is set:
   ```bash
   grep WEATHER_API_KEY .env
   ```
2. Check if the weather API service is available.
3. Ensure your query clearly mentions a location:
   ```
   "What's the weather in Paris?"
   ```

### Custom Tool Issues

**Issue**: Custom tools you've added aren't working correctly.

**Solution**:
1. Verify that your tool is properly registered in `tools/index.ts`.
2. Check for errors in your tool implementation.
3. Ensure any required API keys or configurations are set.
4. Add debug logging to your tool:
   ```typescript
   console.log("Tool input:", params.context);
   ```
5. Test your tool in isolation before integrating it.

## Deployment Challenges

### Deployment Failures

**Issue**: Unable to deploy the function to Supabase.

**Solution**:
1. Verify your Supabase CLI is logged in:
   ```bash
   supabase login
   ```
2. Check for TypeScript errors:
   ```bash
   deno check index.ts
   ```
3. Ensure your function size is within Supabase limits.
4. Check Supabase status for any service disruptions.

### Environment Variable Issues in Deployment

**Issue**: Environment variables not available in the deployed function.

**Solution**:
1. Verify that you've set the secrets in Supabase:
   ```bash
   supabase secrets set --env-file .env
   ```
2. List the secrets to confirm they're set:
   ```bash
   supabase secrets list
   ```
3. Redeploy the function after setting secrets:
   ```bash
   supabase functions deploy mastra
   ```

### Function Not Found After Deployment

**Issue**: Function URL returns 404 after deployment.

**Solution**:
1. Verify the function was deployed successfully:
   ```bash
   supabase functions list
   ```
2. Check the function name for typos.
3. Ensure you're using the correct project reference in the URL.
4. Try redeploying the function:
   ```bash
   supabase functions deploy mastra
   ```

## Performance Concerns

### Slow Response Times

**Issue**: The function takes too long to respond.

**Solution**:
1. Check for inefficient code in your tools or request handling.
2. Consider implementing caching for frequently used data.
3. Monitor external API calls that might be causing delays.
4. Optimize your tool implementations:
   ```typescript
   // Before making API calls, check if we have cached data
   const cachedData = cache.get(cacheKey);
   if (cachedData) return cachedData;
   ```

### Memory Usage Issues

**Issue**: Function crashes or becomes unresponsive due to memory usage.

**Solution**:
1. Limit the size of conversation history stored.
2. Avoid loading large datasets into memory.
3. Use streaming responses for large outputs.
4. Implement pagination for data processing.

## Environment Variable Problems

### Missing Environment Variables

**Issue**: Function fails with errors about missing configuration.

**Solution**:
1. Verify all required environment variables are set:
   ```bash
   # For local development
   cat .env
   
   # For deployed functions
   supabase secrets list
   ```
2. Check for typos in environment variable names.
3. Ensure the `.env` file is in the correct location.
4. For local development, use the `--env-file` flag:
   ```bash
   supabase functions serve mastra --env-file .env
   ```

### Environment Variable Format Issues

**Issue**: Environment variables are set but not recognized correctly.

**Solution**:
1. Check for whitespace or special characters in your variables.
2. Ensure quotes are used correctly for values with spaces:
   ```
   AGENT_INSTRUCTIONS="You are a helpful assistant that provides information and assistance."
   ```
3. Avoid using export statements in your `.env` file.

## Debugging Techniques

### Viewing Logs

**Issue**: Need to see what's happening inside the function.

**Solution**:
1. For local development, logs are printed to the console.
2. For deployed functions, use:
   ```bash
   supabase functions logs mastra
   ```
3. Add more detailed logging to your code:
   ```typescript
   console.log("Processing request:", JSON.stringify(requestData));
   ```

### Testing in Isolation

**Issue**: Need to test components separately to identify problems.

**Solution**:
1. Test individual tools directly:
   ```typescript
   // Create a test file
   const result = await weatherTool.execute({
     context: { location: "New York" }
   });
   console.log(result);
   ```
2. Run the test with Deno:
   ```bash
   deno run --allow-env --allow-net test-tool.ts
   ```

### Debugging Middleware

**Issue**: Requests are being rejected by middleware.

**Solution**:
1. Add debug logging to middleware functions:
   ```typescript
   console.log("Auth header:", req.headers.get("Authorization"));
   ```
2. Temporarily disable middleware for testing:
   ```typescript
   // In middleware/index.ts
   export const applyMiddleware = async (req: Request): Promise<Response | null> => {
     // Comment out middleware for testing
     // const corsResult = corsMiddleware(req);
     // if (corsResult) return corsResult;
     
     // const authResult = authMiddleware(req);
     // if (authResult) return authResult;
     
     return null;
   };
   ```

### Testing with Curl

**Issue**: Need to test the API directly from the command line.

**Solution**:
1. Use curl with verbose output:
   ```bash
   curl -v -X POST http://localhost:54321/functions/v1/mastra \
     -H "Authorization: Bearer your-secret-token" \
     -H "Content-Type: application/json" \
     -d '{"query":"Hello"}'
   ```
2. This shows the full request and response, including headers.

## Common Error Messages and Solutions

### "Missing required field: query"

**Solution**: Ensure your request JSON includes a `query` field:
```json
{
  "query": "Your question here"
}
```

### "Unauthorized: Missing Authorization header"

**Solution**: Add the Authorization header to your request:
```
Authorization: Bearer your-secret-token
```

### "Method not allowed. Only POST requests are supported."

**Solution**: Change your request method from GET, PUT, etc. to POST.

### "Failed to get weather: Invalid location"

**Solution**: Ensure you're providing a valid location in your weather query.

### "Error processing request: Unexpected token in JSON"

**Solution**: Check your request body for JSON syntax errors.

## Getting Additional Help

If you're still experiencing issues after trying the solutions in this guide:

1. Check the [GitHub repository](https://github.com/your-repo) for open issues or create a new one.
2. Review the [API documentation](api-reference.md) for correct usage.
3. Consult the [Supabase Edge Functions documentation](https://supabase.com/docs/guides/functions) for platform-specific issues.
4. Join the [Supabase Discord](https://discord.supabase.com) for community support.

Remember to include relevant logs, error messages, and steps to reproduce when seeking help.