import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Access the environment variable
const SB_ACCESS_TOKEN = Deno.env.get("SB_ACCESS_TOKEN") || "";

console.log("Starting test function...");
console.log(`SB_ACCESS_TOKEN available: ${SB_ACCESS_TOKEN ? "Yes" : "No"}`);

serve((req) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  
  const url = new URL(req.url);
  const name = url.searchParams.get("name") || "World";
  
  console.log(`Request parameters - name: ${name}`);
  console.log(`Authorization header present: ${req.headers.has("Authorization") ? "Yes" : "No"}`);
  
  const response = `Hello, ${name}! This function was created using the Supabase CLI.`;
  console.log(`Sending response: ${response}`);
  
  return new Response(response);
});
