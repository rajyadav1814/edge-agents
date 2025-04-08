/**
 * Finalizer Edge Function
 * Final function in the daisy-chain for enhanced privacy
 * Handles storage and final processing of anonymized data
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Load environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Configuration for the finalizer
interface FinalizerConfig {
  // Table to store anonymized data
  storageTable: string;
  // Whether to log processing events (for debugging)
  enableLogging: boolean;
  // Whether to store the data in the database
  enableStorage: boolean;
}

// Default configuration
const defaultConfig: FinalizerConfig = {
  storageTable: Deno.env.get("STORAGE_TABLE") || "anonymized_data",
  enableLogging: Deno.env.get("ENABLE_LOGGING")?.toLowerCase() === "true" || false,
  enableStorage: Deno.env.get("ENABLE_STORAGE")?.toLowerCase() === "false" ? false : true
};

// Load configuration from environment
function loadConfigFromEnv(): FinalizerConfig {
  const config = { ...defaultConfig };
  
  // Load storage table name
  const storageTable = Deno.env.get("STORAGE_TABLE");
  if (storageTable) {
    config.storageTable = storageTable;
  }
  
  return config;
}

// Store the processed anonymized data
async function storeAnonymizedData(data: any, tableName: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(tableName)
      .insert({
        data: data,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error("Error storing data:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Exception storing data:", error);
    return false;
  }
}

// Main handler function
serve(async (req: Request) => {
  try {
    // Load configuration
    const config = loadConfigFromEnv();
    
    // Log request if logging is enabled
    if (config.enableLogging) {
      console.log(`Finalizing request: ${req.method} ${req.url}`);
    }

    // Extract request body (should be processed data)
    let processedData: any;
    try {
      processedData = await req.json();
    } catch (error) {
      return new Response(JSON.stringify({ 
        error: "Invalid request body",
        details: "Expected JSON with processed data"
      }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Add finalization timestamp
    const finalizedData = {
      ...processedData,
      finalizationTimestamp: Date.now(),
      status: "completed"
    };

    // Store the data if storage is enabled
    let storageSuccess = true;
    if (config.enableStorage) {
      storageSuccess = await storeAnonymizedData(finalizedData, config.storageTable);
      
      if (config.enableLogging) {
        console.log(`Storage ${storageSuccess ? "successful" : "failed"}`);
      }
    }

    // Return the finalized data with storage status
    return new Response(JSON.stringify({
      ...finalizedData,
      storageSuccess
    }), {
      headers: { "Content-Type": "application/json" },
      status: storageSuccess ? 200 : 207, // 207 Multi-Status if storage failed
    });
  } catch (err) {
    console.error("Error in finalizer function:", err);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      details: err instanceof Error ? err.message : String(err)
    }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});