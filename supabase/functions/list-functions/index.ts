import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const projectId = Deno.env.get("VITE_SUPABASE_PROJECT_ID");
    const accessToken = Deno.env.get("SUPABASE_PERSONAL_ACCESS_TOKEN");

    if (!projectId || !accessToken) {
      throw new Error("Missing required environment variables: VITE_SUPABASE_PROJECT_ID or SUPABASE_PERSONAL_ACCESS_TOKEN");
    }

    // List functions using Supabase Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/functions`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to list functions');
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});