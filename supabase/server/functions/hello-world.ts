// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.com/deploy/docs/serve-function

import { serve } from "http/server";

interface RequestParams {
  name?: string;
}

serve(async (req) => {
  try {
    // Parse the request body
    const requestData: RequestParams = await req.json().catch(() => ({}));
    
    // Get the name from the request or use a default
    const name = requestData.name || "World";
    
    // Create the response
    const data = {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
    };
    
    // Return the response
    return new Response(
      JSON.stringify(data),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    // Handle errors
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
