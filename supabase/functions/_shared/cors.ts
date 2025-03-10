// CORS headers for Supabase Edge Functions
// @ts-ignore - Deno is available in Supabase Edge Functions
// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_node_server
const CORS_ORIGIN = Deno.env.get('CORS_ORIGIN') || 'https://agentics.org';

export const corsHeaders = {
  'Access-Control-Allow-Origin': CORS_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

