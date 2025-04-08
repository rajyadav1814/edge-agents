Here's a complete single-file agent using TypeScript, Deno, and Mastra AI that you can deploy as a Supabase Edge Function. This example includes CORS handling, basic authentication, and API functionality:

```typescript
// Import required dependencies
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Basic authentication function
const authenticate = (req: Request): boolean => {
  const authHeader = req.headers.get("Authorization");
  // Replace with your actual authentication logic
  return authHeader === "Bearer your-secret-token";
};

// Create a simple weather tool
const weatherTool = createTool({
  id: "Get Weather",
  description: "Get the current weather for a location",
  inputSchema: z.object({ location: z.string() }),
  execute: async ({ context: { location } }) => {
    // Replace with actual weather API call
    return { temperature: 25, condition: "Sunny", location };
  },
});

// Create Mastra agent
const agent = new Agent({
  name: "WeatherAgent",
  instructions: "You are a helpful assistant that provides weather information.",
  tools: { weatherTool },
});

// Main request handler
const handleRequest = async (req: Request): Promise => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate request
  if (!authenticate(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // Parse request body
  const { query } = await req.json();

  // Generate response using Mastra agent
  const response = await agent.generate([
    { role: "user", content: query },
  ]);

  // Return the agent's response
  return new Response(JSON.stringify({ response: response.text }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
};

// Start the server
serve(handleRequest);

console.log("Weather Agent is running on http://localhost:8000");
```

This single-file agent can be deployed as a Supabase Edge Function. Here's a breakdown of the code and guidance for future updates:

1. **Imports**: The code imports necessary dependencies from Deno's standard library, Mastra AI, and Zod for schema validation. Update these as needed for new features or when upgrading dependencies.

2. **CORS Headers**: CORS headers are defined to allow cross-origin requests. Modify these headers if you need to restrict access to specific origins.

3. **Authentication**: A basic authentication function is included. Replace the placeholder logic with your actual authentication mechanism, such as JWT validation or integration with Supabase Auth.

4. **Weather Tool**: A simple weather tool is created using Mastra AI's `createTool` function. This can be extended or replaced with other tools as needed. Add more tools by creating additional `createTool` instances.

5. **Mastra Agent**: The agent is configured with a name, instructions, and available tools. Modify these properties to change the agent's behavior or add new capabilities.

6. **Request Handler**: The `handleRequest` function processes incoming requests, handles CORS, authenticates the request, and generates responses using the Mastra agent. Extend this function to add new API endpoints or implement more complex request handling.

7. **Server**: The `serve` function from Deno's standard library is used to start the server. This is compatible with Supabase Edge Functions.

To deploy this as a Supabase Edge Function:

1. Save this file as `index.ts` in your Supabase project's `functions` directory.
2. Use the Supabase CLI to deploy: `supabase functions deploy weather-agent`
3. Update your project's environment variables with necessary API keys or configuration.

For future extensibility:

- Add more tools to the agent by creating additional `createTool` instances.
- Implement more sophisticated error handling and logging.
- Create separate modules for authentication, tools, and API routes as your project grows.
- Use Deno's testing utilities to write unit tests for your agent and tools.

Remember to keep your dependencies up to date and refer to the latest Mastra AI, Deno, and Supabase documentation for best practices and new features[1][2][3].
 