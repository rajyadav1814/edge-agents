/**
 * CORS Handling Utility
 * Handles Cross-Origin Resource Sharing (CORS) for API requests
 */
import { EnvironmentValidator } from "../config/env-validator.ts";

/**
 * Check if a request is a preflight request
 * @param req The request object
 * @returns True if the request is a preflight request, false otherwise
 */
export function isPreflightRequest(req: Request): boolean {
  return (
    req.method === "OPTIONS" &&
    req.headers.has("Origin") &&
    req.headers.has("Access-Control-Request-Method")
  );
}

/**
 * Handle a preflight request
 * @param req The request object
 * @returns Response object
 */
export function handlePreflight(req: Request): Response {
  const headers = createCorsHeaders(req);
  
  // Add headers required for preflight
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set(
    "Access-Control-Allow-Headers",
    "Authorization, Content-Type, X-Requested-With"
  );
  headers.set("Access-Control-Max-Age", "86400"); // 24 hours
  
  return new Response(null, {
    status: 204, // No Content
    headers,
  });
}

/**
 * Apply CORS headers to a response
 * @param req The request object
 * @param res The response object
 * @returns Response object with CORS headers
 */
export function applyCorsHeaders(req: Request, res: Response): Response {
  const headers = new Headers(res.headers);
  const corsHeaders = createCorsHeaders(req);
  
  // Copy CORS headers to response
  corsHeaders.forEach((value, key) => {
    headers.set(key, value);
  });
  
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

/**
 * Create CORS headers
 * @param req The request object
 * @returns Headers object with CORS headers
 */
function createCorsHeaders(req: Request): Headers {
  const headers = new Headers();
  const config = EnvironmentValidator.getConfig();
  const origin = req.headers.get("Origin") || "";
  
  // Check if the origin is allowed
  if (config.CORS_ALLOWED_ORIGINS.includes("*")) {
    // Allow any origin
    headers.set("Access-Control-Allow-Origin", origin || "*");
  } else if (origin && config.CORS_ALLOWED_ORIGINS.includes(origin)) {
    // Allow specific origin
    headers.set("Access-Control-Allow-Origin", origin);
  } else {
    // Default to first allowed origin or empty if none
    headers.set(
      "Access-Control-Allow-Origin",
      config.CORS_ALLOWED_ORIGINS[0] || ""
    );
  }
  
  // Allow credentials
  headers.set("Access-Control-Allow-Credentials", "true");
  
  // Add Vary header to indicate that the response varies based on Origin
  headers.set("Vary", "Origin");
  
  return headers;
}