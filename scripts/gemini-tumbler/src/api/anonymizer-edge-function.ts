/**
 * Supabase Edge Function for user data anonymization
 * Implements a daisy-chain approach for enhanced privacy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  anonymizeUserData, 
  forwardToNextFunction,
  AnonymizerConfig,
  UserData
} from "../utils/anonymizer.ts";

// Load environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Default anonymizer configuration
const defaultConfig: AnonymizerConfig = {
  enabled: true,
  salt: Deno.env.get("ANONYMIZER_SALT"),
  fields: {
    userId: true,
    ipAddress: true,
    geolocation: true,
    userAgent: true
  },
  nextFunctionEndpoint: Deno.env.get("NEXT_FUNCTION_ENDPOINT")
};

// Load configuration from environment
function loadConfigFromEnv(): AnonymizerConfig {
  const config = { ...defaultConfig };
  
  // Check if anonymization is enabled
  const enabled = Deno.env.get("ANONYMIZER_ENABLED");
  if (enabled !== undefined) {
    config.enabled = enabled.toLowerCase() === "true";
  }
  
  // Load field configuration
  const fieldsConfig = Deno.env.get("ANONYMIZER_FIELDS");
  if (fieldsConfig) {
    try {
      const fields = JSON.parse(fieldsConfig);
      config.fields = { ...config.fields, ...fields };
    } catch (error) {
      console.error("Failed to parse ANONYMIZER_FIELDS:", error);
    }
  }
  
  // Load next function endpoint
  const nextEndpoint = Deno.env.get("NEXT_FUNCTION_ENDPOINT");
  if (nextEndpoint) {
    config.nextFunctionEndpoint = nextEndpoint;
  }
  
  return config;
}

// Main handler function
serve(async (req: Request) => {
  try {
    // Load configuration
    const config = loadConfigFromEnv();
    
    // Extract Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response(JSON.stringify({ error: "Invalid User" }), {
        headers: { "Content-Type": "application/json" },
        status: 401,
      });
    }

    // Extract request body
    let requestData: any = {};
    if (req.method === "POST" || req.method === "PUT") {
      try {
        requestData = await req.json();
      } catch (e) {
        console.warn("Could not parse request body as JSON");
      }
    }

    // Collect user data for anonymization
    const userData: UserData = {
      userId: user.id,
      ipAddress: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip"),
      userAgent: req.headers.get("user-agent"),
      ...requestData
    };

    // Extract geolocation if available
    const geoLat = req.headers.get("cf-iplatitude");
    const geoLong = req.headers.get("cf-iplongitude");
    const geoCountry = req.headers.get("cf-ipcountry");
    const geoRegion = req.headers.get("cf-region");

    if (geoLat || geoLong || geoCountry || geoRegion) {
      userData.geolocation = {
        latitude: geoLat ? parseFloat(geoLat) : undefined,
        longitude: geoLong ? parseFloat(geoLong) : undefined,
        country: geoCountry || undefined,
        region: geoRegion || undefined
      };
    }

    // Anonymize the user data
    const anonymizedData = await anonymizeUserData(userData, config);

    // If no next function is configured, return the anonymized data
    if (!config.nextFunctionEndpoint) {
      return new Response(JSON.stringify(anonymizedData), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Forward to next function in the chain
    try {
      const response = await forwardToNextFunction(
        anonymizedData,
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
    console.error("Error in anonymizer function:", err);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: err instanceof Error ? err.message : String(err)
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});