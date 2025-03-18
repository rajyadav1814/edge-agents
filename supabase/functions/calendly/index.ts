import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCors } from "../_shared/cors.ts";

// Function to create a scheduling link
async function createSchedulingLink(req: Request) {
  try {
    const body = await req.json();
    
    // Default to 30 minutes if no duration is specified
    let schedulingUrl = "https://calendly.com/ruv/30-minutes-with-ruv";
    
    // If eventTypeUri is provided, check for duration
    if (body.eventTypeUri) {
      const uri = body.eventTypeUri.toLowerCase();
      
      if (uri.includes("15min") || uri.includes("15-min")) {
        schedulingUrl = "https://calendly.com/ruv/ruv-15-min-paid";
      } else if (uri.includes("60min") || uri.includes("60-min") || uri.includes("1hour") || uri.includes("1-hour")) {
        schedulingUrl = "https://calendly.com/ruv/60-minutes-with-ruv";
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          schedulingUrl,
          message: "Scheduling link created successfully"
        }
      }),
      {
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred"
      }),
      {
        status: 400,
        headers: {
          ...getCorsHeaders(req),
          "Content-Type": "application/json"
        }
      }
    );
  }
}

// Main handler function
serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req);
  if (corsResponse) {
    return corsResponse;
  }

  // Get the path from the URL
  const url = new URL(req.url);
  const path = url.pathname.split("/").pop();

  // Route the request based on the path
  if (req.method === "POST" && path === "create-scheduling-link") {
    return await createSchedulingLink(req);
  }
  
  // Return 404 for any other routes
  return new Response(
    JSON.stringify({
      success: false,
      error: "Not found"
    }),
    {
      status: 404,
      headers: {
        ...getCorsHeaders(req),
        "Content-Type": "application/json"
      }
    }
  );
});
