/**
 * Mastra AI Agent - Supabase Edge Function
 * 
 * This is the main entry point for the Mastra AI agent Edge Function.
 * It handles incoming requests, processes them using the Mastra agent,
 * and returns appropriate responses.
 */

import { serve } from "std/http/server.ts";
import { corsHeaders, addCorsHeaders } from "./middleware/cors.ts";
import { applyMiddleware } from "./middleware/index.ts";
import { config } from "./config/index.ts";
import { tools } from "./tools/index.ts";
import { MastraRequest, MastraResponse, ErrorResponse, Message } from "./types/index.ts";

/**
 * Main request handler for the Mastra AI agent
 * 
 * @param req The incoming request
 * @returns A response with the agent's output or an error
 */
const handleRequest = async (req: Request): Promise<Response> => {
  // Handle preflight requests and apply middleware
  const middlewareResult = await applyMiddleware(req);
  if (middlewareResult) return middlewareResult;
  
  try {
    // Only accept POST requests
    if (req.method !== "POST") {
      return createErrorResponse("Method not allowed. Only POST requests are supported.", 405);
    }
    
    // Parse request body
    const requestData = await req.json() as MastraRequest;
    
    // Validate request
    if (!requestData.query) {
      return createErrorResponse("Missing required field: query", 400);
    }
    
    // Process the request with the Mastra agent
    const response = await processRequest(requestData);
    
    // Return the response
    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { 
          "Content-Type": "application/json",
          ...corsHeaders
        } 
      }
    );
  } catch (error: unknown) {
    // Handle errors
    console.error("Error processing request:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createErrorResponse(`Error processing request: ${errorMessage}`, 500);
  }
};

/**
 * Process a request using the Mastra AI agent
 * 
 * @param requestData The request data to process
 * @returns The agent's response
 */
const processRequest = async (requestData: MastraRequest): Promise<MastraResponse> => {
  // In a real implementation, this would use the Mastra AI SDK
  // For now, we'll simulate a response
  
  const { query, context = {}, history = [] } = requestData;
  
  // Create a message array for the agent
  const messages: Message[] = [
    { role: "system", content: config.agent.instructions },
    ...history,
    { role: "user", content: query }
  ];
  
  // Simulate agent processing
  // In a real implementation, this would call the Mastra AI API
  console.log(`Processing query: "${query}" with ${tools.length} available tools`);
  
  // For demonstration, we'll create a simple response
  // that mentions the weather tool if the query contains weather-related terms
  let responseText = `You asked: "${query}"\n\n`;
  
  if (query.toLowerCase().includes("weather")) {
    try {
      const weatherResult = await tools[0].execute({ 
        context: { location: extractLocation(query) || "New York" } 
      });
      responseText += `I checked the weather for you. ${formatWeatherResponse(weatherResult)}`;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      responseText += `I tried to check the weather, but encountered an error: ${errorMessage}`;
    }
  } else {
    responseText += "I'm the Mastra AI assistant. I can help you with various tasks, including checking the weather.";
  }
  
  return {
    response: responseText,
    metadata: {
      processedAt: new Date().toISOString(),
      agentName: config.agent.name
    }
  };
};

/**
 * Extract a location from a query string
 * 
 * @param query The query to extract a location from
 * @returns The extracted location or null if none found
 */
const extractLocation = (query: string): string | null => {
  // This is a very simple location extraction
  // In a real implementation, this would use NLP or a more sophisticated approach
  const locationMatches = query.match(/(?:in|at|for)\s+([A-Za-z\s]+)(?:\.|\?|$)/i);
  return locationMatches ? locationMatches[1].trim() : null;
};

/**
 * Format a weather response for display
 * 
 * @param weatherData The weather data to format
 * @returns A formatted string with the weather information
 */
const formatWeatherResponse = (weatherData: any): string => {
  const { temperature, condition, location, humidity, windSpeed, unit = "celsius" } = weatherData;
  
  let response = `The current weather in ${location} is ${condition.toLowerCase()} with a temperature of ${temperature}°${unit === "celsius" ? "C" : "F"}.`;
  
  if (humidity !== undefined) {
    response += ` The humidity is ${humidity}%.`;
  }
  
  if (windSpeed !== undefined) {
    response += ` Wind speed is ${windSpeed} km/h.`;
  }
  
  return response;
};

/**
 * Create an error response
 * 
 * @param message The error message
 * @param status The HTTP status code
 * @returns A Response object with the error details
 */
const createErrorResponse = (message: string, status: number): Response => {
  const errorResponse: ErrorResponse = {
    error: message
  };
  
  return new Response(
    JSON.stringify(errorResponse),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders
      }
    }
  );
};

// For testing and development
export { handleRequest };

// Only start the server when this file is run directly, not when imported for testing
if (import.meta.main) {
  console.log("Starting Mastra AI agent server...");
  // Use port 9876 to avoid conflicts with other services
  serve(handleRequest, { port: 9876 });
}