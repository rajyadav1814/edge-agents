// supabase/functions/mcp-server/mcp_server.ts
import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

serve(async (req) => {
  return new Response("Hello from mcp_server!", {
    headers: { "Content-Type": "text/plain" },
  });
});