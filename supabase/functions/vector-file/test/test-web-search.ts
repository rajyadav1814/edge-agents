import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";

// Load environment variables
const env = await load({ export: true });
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
const PROJECT_ID = Deno.env.get("SUPABASE_PROJECT_ID");

if (!ANON_KEY || !PROJECT_ID) {
  console.error("Error: SUPABASE_ANON_KEY and SUPABASE_PROJECT_ID are required in .env file");
  Deno.exit(1);
}

// Create vector store
console.log("\nCreating vector store...");
const createStoreResponse = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/vector-file/create-store`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "test-web-search",
    expiresAfter: {
      anchor: "last_active_at",
      days: 1
    }
  })
});

const { id: vectorStoreId } = await createStoreResponse.json();
console.log(`Vector store created with ID: ${vectorStoreId}`);

// Perform web search
console.log("\nPerforming web search...");
const searchResponse = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/vector-file/query`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    vectorStoreId,
    question: "What are the latest trends in baking bread at home?",
    maxResults: 5,
    webSearch: {
      enabled: true,
      contextSize: "high",
      user_location: {
        type: "approximate",
        approximate: {
          country: "US",
          city: "San Francisco",
          region: "California"
        }
      }
    }
  })
});

const searchResults = await searchResponse.json();
console.log("\nWeb search results:", JSON.stringify(searchResults, null, 2));

// Check vector store status
console.log("\nChecking vector store status...");
const statusResponse = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/vector-file/check-status`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    vectorStoreId
  })
});

const status = await statusResponse.json();
console.log("\nVector store status:", JSON.stringify(status, null, 2));

// Verify data in vector store
console.log("\nVerifying data in vector store...");
const verifyResponse = await fetch(`https://${PROJECT_ID}.supabase.co/functions/v1/vector-file/search`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    vectorStoreId,
    query: "bread baking trends",
    maxResults: 5
  })
});

const verifyResults = await verifyResponse.json();
console.log("\nVerification results:", JSON.stringify(verifyResults, null, 2));