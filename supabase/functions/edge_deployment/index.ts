import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

interface DeployFunctionRequest {
  slug: string;
  filePath: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { slug, filePath } = await req.json() as DeployFunctionRequest;

    if (!slug || !filePath) {
      throw new Error("Missing required parameters: slug and filePath");
    }

    const projectId = Deno.env.get("VITE_SUPABASE_PROJECT_ID");
    const accessToken = Deno.env.get("SUPABASE_PERSONAL_ACCESS_TOKEN");

    if (!projectId || !accessToken) {
      throw new Error("Missing required environment variables: VITE_SUPABASE_PROJECT_ID or SUPABASE_PERSONAL_ACCESS_TOKEN");
    }

    // Read the function file
    const content = await Deno.readTextFile(filePath);

    // Create request payload
    const payload = {
      slug,
      name: slug,
      body: content,
      verify_jwt: true
    };

    // Deploy function using Supabase Management API
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${projectId}/functions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

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
