/**
 * Calendly Edge Function Test Script
 * 
 * This script tests the Calendly edge function by making requests to the local server.
 * Run this script after starting the local server with:
 * supabase functions serve calendly
 */

// Test configuration
const BASE_URL = "http://localhost:54321/functions/v1/calendly";
const TOKEN = Deno.env.get("CALENDLY_PERSONAL_ACCESS_TOKEN");

// Helper function to make requests
async function makeRequest(endpoint: string, method = "GET", body: any = null) {
  const url = `${BASE_URL}/${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${TOKEN}`
  };

  const options: RequestInit = {
    method,
    headers
  };

  if (body && (method === "POST" || method === "PUT" || method === "PATCH")) {
    options.body = JSON.stringify(body);
  }

  console.log(`Making ${method} request to ${url}`);
  
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    console.log(`Response status: ${response.status}`);
    console.log("Response data:", JSON.stringify(data, null, 2));
    
    return { success: response.ok, data };
  } catch (error) {
    // Handle error properly with type checking
    let errorMessage = "Unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    console.error("Error making request:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

// Test functions
async function testGetCurrentUser() {
  console.log("\n=== Testing Get Current User ===");
  return await makeRequest("me");
}

async function testListEventTypes(userUri: string) {
  console.log("\n=== Testing List Event Types ===");
  return await makeRequest(`event-types?user=${encodeURIComponent(userUri)}`);
}

async function testListScheduledEvents(userUri: string) {
  console.log("\n=== Testing List Scheduled Events ===");
  return await makeRequest(`scheduled-events?user=${encodeURIComponent(userUri)}`);
}

// Main test function
async function runTests() {
  console.log("Starting Calendly API tests...");
  
  if (!TOKEN) {
    console.error("Error: CALENDLY_PERSONAL_ACCESS_TOKEN environment variable is not set.");
    console.log("Please set it before running the tests:");
    console.log("export CALENDLY_PERSONAL_ACCESS_TOKEN=your-token");
    Deno.exit(1);
  }
  
  // Test 1: Get current user
  const userResult = await testGetCurrentUser();
  
  if (!userResult.success) {
    console.error("Failed to get current user. Stopping tests.");
    Deno.exit(1);
  }
  
  // Extract user URI for subsequent tests
  const userUri = userResult.data.resource.uri;
  console.log(`User URI: ${userUri}`);
  
  // Test 2: List event types
  await testListEventTypes(userUri);
  
  // Test 3: List scheduled events
  await testListScheduledEvents(userUri);
  
  console.log("\nAll tests completed!");
}

// Run the tests
runTests().catch(error => {
  console.error("Test error:", error);
  Deno.exit(1);
});