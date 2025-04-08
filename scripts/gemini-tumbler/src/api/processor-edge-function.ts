/**
 * Processor Edge Function
 * Second function in the daisy-chain for enhanced privacy
 * Processes anonymized data without access to original user information
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AnonymizedData } from "../utils/anonymizer.ts";

// Configuration for the processor
interface ProcessorConfig {
  // Optional endpoint for the next function in the chain
  nextFunctionEndpoint?: string;
  // Whether to log processing events (for debugging)
  enableLogging: boolean;
}

// Default configuration
const defaultConfig: ProcessorConfig = {
  nextFunctionEndpoint: Deno.env.get("NEXT_FUNCTION_ENDPOINT"),
  enableLogging: Deno.env.get("ENABLE_LOGGING")?.toLowerCase() === "true" || false
};

// Load configuration from environment
function loadConfigFromEnv(): ProcessorConfig {
  const config = { ...defaultConfig };
  
  // Load next function endpoint
  const nextEndpoint = Deno.env.get("NEXT_FUNCTION_ENDPOINT");
  if (nextEndpoint) {
    config.nextFunctionEndpoint = nextEndpoint;
  }
  
  return config;
}

// Process the anonymized data
async function processAnonymizedData(data: AnonymizedData): Promise<any> {
  // Here you would implement your actual processing logic
  // This is just a placeholder that adds a processing timestamp
  
  return {
    ...data,
    processingTimestamp: Date.now(),
    processingComplete: true
  };
}

// Forward to the next function in the chain
async function forwardToNextFunction(
  processedData: any,
  endpoint: string,
  token?: string
): Promise<Response> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(processedData),
  });
}

// Main handler function
serve(async (req: Request) => {
  try {
    // Load configuration
    const config = loadConfigFromEnv();
    
    // Extract Authorization header for potential forwarding
    const authHeader = req.headers.get("Authorization");
    const token = authHeader ? authHeader.replace("Bearer ", "") : undefined;
    
    // Log request if logging is enabled
    if (config.enableLogging) {
      console.log(`Processing request: ${req.method} ${req.url}`);
    }

    // Extract request body (should be anonymized data)
    let anonymizedData: AnonymizedData;
    try {
      anonymizedData = await req.json() as AnonymizedData;
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: "Invalid request body",
        details: "Expected JSON with anonymized data"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Validate that we received anonymized data
    if (!anonymizedData.timestamp) {
      return new Response(JSON.stringify({ 
        error: "Invalid anonymized data",
        details: "Missing required fields"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Process the anonymized data
    const processedData = await processAnonymizedData(anonymizedData);

    // If no next function is configured, return the processed data
    if (!config.nextFunctionEndpoint) {
      return new Response(JSON.stringify(processedData), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Forward to next function in the chain
    try {
      const response = await forwardToNextFunction(
        processedData,
        config.nextFunctionEndpoint,
        token
      );

      // Return the response from the next function
      const responseBody = await response.text();
      return new Response(responseBody, {
        headers: { 
          "Content-Type": response.headers.get("Content-Type") || "application/json"
        },
        status: response.status,
      });
    } catch (error) {
      console.error("Error forwarding to next function:", error);
      return new Response(JSON.stringify({ 
        error: "Failed to forward request",
        details: error instanceof Error ? error.message : String(error)
      }), {
        headers: { "Content-Type": "application/json" },
        status: 500,
      });
    }
  } catch (err) {
    console.error("Error in processor function:", err);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: err instanceof Error ? err.message : String(err)
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});