/**
 * CORS middleware for Supabase Edge Functions
 * 
 * This module provides CORS (Cross-Origin Resource Sharing) handling for the Mastra AI agent.
 */

/**
 * Default CORS headers to allow cross-origin requests
 */
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * Middleware function to handle CORS preflight requests and add CORS headers
 * 
 * @param req The incoming request object
 * @returns A Response object for preflight requests or null to continue processing
 */
export const corsMiddleware = (req: Request): Response | null => {
  // Handle CORS preflight requests (OPTIONS method)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204, // No content
      headers: corsHeaders,
    });
  }
  
  // For other requests, return null to continue processing
  // The calling function should add corsHeaders to the final response
  return null;
};

/**
 * Utility function to add CORS headers to a response
 * 
 * @param response The response object to add headers to
 * @returns The response with CORS headers added
 */
export const addCorsHeaders = (response: Response): Response => {
  const newHeaders = new Headers(response.headers);
  
  // Add each CORS header
  Object.entries(corsHeaders).forEach(([key, value]) => {
    newHeaders.set(key, value);
  });
  
  // Create a new response with the same body, status, and updated headers
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
};

export default corsMiddleware;