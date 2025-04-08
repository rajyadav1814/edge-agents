/**
 * Integration test for Cloudflare Worker in the daisy chain
 * Tests the complete flow from Supabase Edge Function to Cloudflare Worker to next service
 */

import { assertEquals, assertNotEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { delay } from "https://deno.land/std@0.168.0/async/delay.ts";

// Configuration for the test
const config = {
  // First service in the chain (Supabase Edge Function)
  firstServiceUrl: Deno.env.get("FIRST_SERVICE_URL") || "http://localhost:8000/anonymizer",
  // Cloudflare Worker URL
  cloudflareWorkerUrl: Deno.env.get("CLOUDFLARE_WORKER_URL") || "http://localhost:8787",
  // Final service in the chain
  finalServiceUrl: Deno.env.get("FINAL_SERVICE_URL") || "http://localhost:8001/finalizer",
  // Auth token for testing
  authToken: Deno.env.get("TEST_AUTH_TOKEN") || "test-token"
};

// Mock server to simulate services in the chain
class MockServer {
  private port: number;
  private handler: (req: Request) => Promise<Response> | Response;
  private abortController: AbortController;
  
  constructor(port: number, handler: (req: Request) => Promise<Response> | Response) {
    this.port = port;
    this.handler = handler;
    this.abortController = new AbortController();
  }
  
  async start(): Promise<void> {
    Deno.serve({
      port: this.port,
      signal: this.abortController.signal,
      handler: this.handler
    });
    
    console.log(`Mock server started on port ${this.port}`);
    return Promise.resolve();
  }
  
  stop(): void {
    this.abortController.abort();
    console.log(`Mock server on port ${this.port} stopped`);
  }
}

// Test the complete daisy chain
Deno.test({
  name: "Cloudflare Integration - Complete daisy chain test",
  fn: async () => {
    // Skip this test if running in CI environment without proper setup
    if (Deno.env.get("CI") === "true" && !Deno.env.get("CLOUDFLARE_WORKER_URL")) {
      console.log("Skipping Cloudflare integration test in CI environment");
      return;
    }
    
    // Start mock servers if using localhost
    const mockServers: MockServer[] = [];
    
    if (config.firstServiceUrl.includes("localhost")) {
      // Mock first service (Supabase Edge Function)
      const firstServicePort = parseInt(config.firstServiceUrl.split(":")[2].split("/")[0]);
      const firstServiceMock = new MockServer(firstServicePort, async (req) => {
        const body = await req.json();
        console.log("First service received:", body);
        
        // Forward to Cloudflare Worker
        const response = await fetch(config.cloudflareWorkerUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": req.headers.get("Authorization") || ""
          },
          body: JSON.stringify({
            ...body,
            firstServiceProcessed: true
          })
        });
        
        return new Response(await response.text(), {
          status: response.status,
          headers: response.headers
        });
      });
      
      mockServers.push(firstServiceMock);
      await firstServiceMock.start();
    }
    
    if (config.finalServiceUrl.includes("localhost")) {
      // Mock final service
      const finalServicePort = parseInt(config.finalServiceUrl.split(":")[2].split("/")[0]);
      const finalServiceMock = new MockServer(finalServicePort, async (req) => {
        const body = await req.json();
        console.log("Final service received:", body);
        
        // Return success response
        return new Response(JSON.stringify({
          success: true,
          message: "Data processed successfully",
          receivedData: body
        }), {
          headers: { "Content-Type": "application/json" }
        });
      });
      
      mockServers.push(finalServiceMock);
      await finalServiceMock.start();
    }
    
    try {
      // Test data
      const testData = {
        userId: "test-user-" + Date.now(),
        sensitiveData: "This is sensitive information",
        timestamp: Date.now()
      };
      
      // Send request to first service
      const response = await fetch(config.firstServiceUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${config.authToken}`,
          "User-Agent": "Integration Test User Agent",
          "X-Forwarded-For": "192.168.1.100"
        },
        body: JSON.stringify(testData)
      });
      
      // Verify response
      assertEquals(response.status, 200, "Response status should be 200");
      
      const responseData = await response.json();
      console.log("Final response:", responseData);
      
      // Basic verification of the response
      assertEquals(responseData.success, true, "Response should indicate success");
      assertEquals(typeof responseData.message, "string", "Response should include a message");
      
      // Verify that sensitive data was processed through the chain
      const receivedData = responseData.receivedData;
      
      // User ID should be anonymized (not present in original form)
      assertEquals(receivedData.userId, undefined, "Original userId should not be present");
      assertNotEquals(receivedData.userIdHash, undefined, "User ID hash should be present");
      
      // Sensitive data should still be present (not anonymized)
      assertEquals(receivedData.sensitiveData, testData.sensitiveData, "Sensitive data should be preserved");
      
      // IP and user agent should be anonymized
      assertNotEquals(receivedData.ipHash, undefined, "IP hash should be present");
      assertNotEquals(receivedData.userAgentHash, undefined, "User agent hash should be present");
      
    } finally {
      // Clean up mock servers
      for (const server of mockServers) {
        server.stop();
      }
      
      // Allow time for servers to shut down
      await delay(100);
    }
  },
  sanitizeResources: false,
  sanitizeOps: false
});