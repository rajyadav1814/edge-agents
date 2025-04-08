/**
 * Test script for MCP discovery endpoint
 *
 * This script tests the MCP discovery endpoint to ensure it returns
 * the expected response format and data.
 */

// Make this a module
export {};

// Base URL for local testing
const BASE_URL = Deno.env.get("TEST_BASE_URL") || "http://localhost:8002";

// Test the MCP discovery endpoint
async function testMcpDiscovery() {
  console.log("Testing MCP discovery endpoint...");
  
  try {
    // Make a request to the discovery endpoint
    const response = await fetch(`${BASE_URL}`);
    
    // Check if the response is successful
    if (!response.ok) {
      throw new Error(`Failed to fetch MCP discovery: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response as JSON
    const data = await response.json();
    
    // Validate the response structure
    if (!data.name || !data.version || !data.endpoints) {
      throw new Error("Invalid MCP discovery response: missing required fields");
    }
    
    // Log the discovery data
    console.log("MCP Discovery Response:");
    console.log(JSON.stringify(data, null, 2));
    
    console.log("\n✅ MCP discovery test passed!");
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ MCP discovery test failed: ${errorMessage}`);
    return false;
  }
}

// Run the test
await testMcpDiscovery();