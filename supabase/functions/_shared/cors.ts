// CORS headers for Supabase Edge Functions
export const corsHeaders = {
  // Check the origin and set the appropriate Allow-Origin header
  'Access-Control-Allow-Origin': '*', // Allow all origins for now, will be dynamically set in the handler
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
};

// Function to get CORS headers with the appropriate origin
export function getCorsHeaders(req: Request) {
  const origin = req.headers.get('Origin') || '';
  const allowedOrigins = ['https://agentics.org', 'http://127.0.0.1:8080', 'https://booking.ruv.io'];
  
  // If the request origin is in our allowed list, set it as the allowed origin
  // Otherwise, default to the first allowed origin
  const allowedOrigin = allowedOrigins.includes(origin) 
    ? origin 
    : allowedOrigins[0];
  
  return {
    ...corsHeaders,
    'Access-Control-Allow-Origin': allowedOrigin
  };
}

// Handle OPTIONS requests for CORS preflight
export function handleCors(req: Request) {
  // Return a response with CORS headers for OPTIONS requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: getCorsHeaders(req) });
  }
  return null;
}
