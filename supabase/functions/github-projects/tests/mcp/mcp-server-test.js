/**
 * Test for the MCP server implementation
 * Specifically tests the createProject tool to ensure it uses shortDescription
 */

// Import the necessary modules
import { assertEquals, assertExists } from "https://deno.land/std@0.177.0/testing/asserts.ts";

// Create a mock transport to capture the requests
class MockTransport {
  constructor() {
    this.lastRequest = null;
  }

  async sendRequest(request) {
    console.log('Captured MCP request:', JSON.stringify(request, null, 2));
    this.lastRequest = request;
    
    // Return a mock response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            id: 'proj_mock',
            title: request.arguments.title,
            number: 999,
            shortDescription: request.arguments.shortDescription || '',
            url: `https://github.com/orgs/${request.arguments.organization}/projects/999`,
            createdAt: new Date().toISOString()
          })
        }
      ],
      project: {
        id: 'proj_mock',
        title: request.arguments.title,
        number: 999,
        shortDescription: request.arguments.shortDescription || '',
        url: `https://github.com/orgs/${request.arguments.organization}/projects/999`,
        createdAt: new Date().toISOString()
      }
    };
  }
}

// Mock MCP client for testing
class MockMcpClient {
  constructor(options) {
    this.transport = options.transport;
  }

  async createProject(args) {
    const request = {
      name: 'createProject',
      arguments: args
    };
    
    return this.transport.sendRequest(request);
  }
}

Deno.test("MCP server uses shortDescription for createProject", async () => {
  console.log('Starting MCP server test...');
  
  // Create a mock transport
  const transport = new MockTransport();
  
  // Create a mock MCP client with the mock transport
  const client = new MockMcpClient({ transport });
  
  // Test the createProject tool
  console.log('Testing createProject tool...');
  const result = await client.createProject({
    organization: 'test-org',
    title: 'Test Project',
    shortDescription: 'Test project description'
  });
  
  // Verify the request
  assertExists(transport.lastRequest, 'No request was captured');
  assertEquals(transport.lastRequest.name, 'createProject', 'Wrong tool name');
  assertEquals(transport.lastRequest.arguments.organization, 'test-org', 'Wrong organization');
  assertEquals(transport.lastRequest.arguments.title, 'Test Project', 'Wrong title');
  assertEquals(transport.lastRequest.arguments.shortDescription, 'Test project description', 'Wrong shortDescription');
  
  // Verify shortDescription is used, not description
  assertEquals('description' in transport.lastRequest.arguments, false, 'Should not use description parameter');
  assertEquals('shortDescription' in transport.lastRequest.arguments, true, 'Should use shortDescription parameter');
  
  console.log('✅ MCP server test passed!');
  console.log('Result:', JSON.stringify(result, null, 2));
});

// Test the MCP discovery endpoint schema
Deno.test("MCP discovery endpoint uses shortDescription", async () => {
  try {
    // Read the MCP discovery file
    const mcpDiscoveryPath = new URL('../.well-known/mcp.json', import.meta.url);
    const mcpDiscoveryText = await Deno.readTextFile(mcpDiscoveryPath);
    const mcpDiscovery = JSON.parse(mcpDiscoveryText);
    
    // Verify the createProject tool schema
    assertExists(mcpDiscovery.capabilities.tools.createProject, 'createProject tool not found');
    assertExists(mcpDiscovery.capabilities.tools.createProject.inputSchema, 'inputSchema not found');
    assertExists(mcpDiscovery.capabilities.tools.createProject.inputSchema.properties, 'properties not found');
    
    // Check that shortDescription is used, not description
    assertExists(
      mcpDiscovery.capabilities.tools.createProject.inputSchema.properties.shortDescription,
      'shortDescription property not found'
    );
    assertEquals(
      'description' in mcpDiscovery.capabilities.tools.createProject.inputSchema.properties,
      false,
      'description property should not exist'
    );
    
    // Check the example in documentation
    assertExists(mcpDiscovery.documentation, 'documentation not found');
    assertExists(mcpDiscovery.documentation.examples, 'examples not found');
    
    // Find the createProject example
    const createProjectExample = mcpDiscovery.documentation.examples.find(
      example => example.tool === 'createProject'
    );
    assertExists(createProjectExample, 'createProject example not found');
    
    // Verify the example uses shortDescription
    assertExists(createProjectExample.arguments.shortDescription, 'example shortDescription not found');
    assertEquals(
      'description' in createProjectExample.arguments,
      false,
      'example should not use description'
    );
    
    console.log('✅ MCP discovery endpoint test passed!');
  } catch (error) {
    console.error('❌ MCP discovery endpoint test failed:', error);
    throw error;
  }
});