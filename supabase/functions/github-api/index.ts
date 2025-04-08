// GitHub API Edge Function for Agentics
// This function securely proxies requests to the GitHub API with authentication

// @ts-ignore - Deno modules
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Get the GitHub token from environment variables
const githubToken = Deno.env.get('GITHUB_TOKEN') || '';
const githubOrg = Deno.env.get('GITHUB_ORG') || 'example-org';

if (!githubToken) {
  console.warn('GITHUB_TOKEN environment variable is not set. API requests may be rate-limited.');
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the URL to determine the request type
    const url = new URL(req.url);
    const path = url.pathname;
    
    console.log('Request path:', path);
    
    // Determine which GitHub API endpoint to call based on the path
    let githubApiUrl: string;
    let responseTransformer: (data: any) => any = (data) => data; // Default: no transformation
    
    if (path.includes('/readme/')) {
      // Handle readme requests: /github-api/readme/{repoName} - get the README content for a specific repo
      const repoName = path.split('/readme/')[1];
      githubApiUrl = `https://api.github.com/repos/${githubOrg}/${repoName}/readme`;
      console.log(`Fetching readme for repo: ${repoName}`);
    } else {
      // Handle repository list requests
      githubApiUrl = `https://api.github.com/orgs/${githubOrg}/repos`;
    }
    
    console.log(`Proxying request to GitHub API: ${githubApiUrl}`);
    
    // Make the request to GitHub API with authentication
    const response = await fetch(githubApiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Agentics-Supabase-Edge-Function',
        ...(githubToken ? { 'Authorization': `token ${githubToken}` } : {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response as JSON
    let data = await response.json();
    
    // Return the response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });
  } catch (error: any) {
    console.error('Error in GitHub API edge function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch data from GitHub API', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});