/**
 * Tests for MCP server and client implementations
 */

import { 
  assertEquals, 
  assertExists,
  assertInstanceOf 
} from "https://deno.land/std/testing/asserts.ts";
import { McpServer } from "./mcpServer.ts";
import { McpClient } from "./mcpClient.ts";
import { McpTool } from "../types/mcp.ts";

// Test configuration
const TEST_PORT = 3001;
const TEST_AUTH_TOKEN = "test-token";

// Define response analysis types
interface AnalysisResponse {
  quality: "high" | "low";
  metrics: {
    length: number;
    complexity: number;
  };
}

interface AnalysisArgs {
  content: string;
}

// Mock tool for testing
const mockAnalysisTool: McpTool<AnalysisArgs, AnalysisResponse> = {
  name: "analyze-response",
  description: "Analyzes model responses for quality metrics",
  execute: async (args: AnalysisArgs): Promise<AnalysisResponse> => {
    return {
      quality: args.content.length > 100 ? "high" : "low",
      metrics: {
        length: args.content.length,
        complexity: args.content.split(" ").length
      }
    };
  }
};

Deno.test("MCP Server and Client Integration", async (t) => {
  const server = new McpServer({
    port: TEST_PORT,
    authToken: TEST_AUTH_TOKEN
  });

  // Register test tools
  server.registerTool(mockAnalysisTool);

  // Start server
  const serverPromise = server.start();

  // Give server time to start
  await new Promise(resolve => setTimeout(resolve, 100));

  await t.step("Client Discovery", async () => {
    const client = new McpClient({
      serverUrl: `http://localhost:${TEST_PORT}`,
      authToken: TEST_AUTH_TOKEN
    });

    await client.initialize();
    const info = client.getDiscoveryInfo();
    
    assertExists(info);
    assertEquals(info.serverName, "gemini-tumbler-mcp");
    assertEquals(info.tools.length, 1);
    assertEquals(info.tools[0].name, "analyze-response");
  });

  await t.step("Tool Execution", async () => {
    const client = new McpClient({
      serverUrl: `http://localhost:${TEST_PORT}`,
      authToken: TEST_AUTH_TOKEN
    });

    await client.initialize();
    const tool = client.getTool("analyze-response") as McpTool<AnalysisArgs, AnalysisResponse>;
    assertExists(tool);

    const result = await tool.execute({
      content: "This is a test response that should be long enough to be considered high quality based on our mock implementation."
    });

    assertEquals(result.quality, "high");
    assertExists(result.metrics);
    assertEquals(typeof result.metrics.length, "number");
    assertEquals(typeof result.metrics.complexity, "number");
  });

  await t.step("Invalid Authentication", async () => {
    const client = new McpClient({
      serverUrl: `http://localhost:${TEST_PORT}`,
      authToken: "invalid-token"
    });

    try {
      await client.initialize();
      throw new Error("Should have failed with invalid token");
    } catch (error: unknown) {
      assertInstanceOf(error, Error);
      assertEquals(error.message.includes("Discovery failed"), true);
    }
  });

  // Stop server
  await server.stop();
  await serverPromise;
});

Deno.test("MCP Server Tool Registry", async () => {
  const server = new McpServer({
    port: TEST_PORT,
    authToken: TEST_AUTH_TOKEN
  });

  server.registerTool(mockAnalysisTool);
  
  const tools = server.listTools();
  assertEquals(tools.length, 1);
  assertEquals(tools[0].name, "analyze-response");
  
  const tool = server.getTool("analyze-response") as McpTool<AnalysisArgs, AnalysisResponse>;
  assertExists(tool);
  assertEquals(tool.description, mockAnalysisTool.description);
  
  const result = await tool.execute({
    content: "Test content"
  });
  assertEquals(result.quality, "low");
});

Deno.test("MCP Client Error Handling", async () => {
  const client = new McpClient({
    serverUrl: "http://localhost:9999", // Use unavailable port
    authToken: TEST_AUTH_TOKEN
  });

  try {
    await client.initialize();
    throw new Error("Should have failed to connect");
  } catch (error: unknown) {
    assertInstanceOf(error, Error);
    assertEquals(error.message.includes("connect"), true);
  }
});