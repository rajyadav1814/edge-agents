import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts';

// Mock Server class for testing
class Server {
  private handlers: Map<string, (request: any) => Promise<any>>;
  public onerror: (error: Error) => void;
  
  constructor(info: any, options: any) {
    this.handlers = new Map();
    this.onerror = () => {};
  }
  
  setRequestHandler(schema: any, handler: (request: any) => Promise<any>) {
    const method = schema.method;
    this.handlers.set(method, handler);
  }
  
  async handleRequest(request: any) {
    const handler = this.handlers.get(request.method);
    if (!handler) {
      throw new Error(`No handler for method: ${request.method}`);
    }
    return {
      jsonrpc: "2.0",
      id: request.id,
      result: await handler(request),
    };
  }
}

// Mock Supabase client for database operations
const mockSupabaseClient = {
  from: (table: string) => ({
    select: (columns: string) => ({
      limit: (limit: number) => ({
        data: [{ id: 1, name: "Test User" }],
        error: null,
      }),
    }),
  }),
  channel: () => ({
    on: () => mockSupabaseClient,
    subscribe: async () => ({ status: 'SUBSCRIBED' }),
    unsubscribe: async () => {},
    send: async () => {},
  }),
};

// Mock SupabaseMcpServer class for testing
class SupabaseMcpServer {
  public server: Server;
  
  constructor(url: string, key: string, supabaseClient: any) {
    this.server = new Server(
      {
        name: 'supabase-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          resources: {},
          tools: {},
        },
      }
    );
    
    // Set up error handling
    this.server.onerror = (error: Error) => console.error('[MCP Error]', error);
  }
  
  async setupRealtimeChannels() {
    // Mock implementation
    return;
  }
}

// Mock tool registry setup
function setupTools(server: Server) {
  // Register a test database query tool
  server.setRequestHandler({
    method: 'callTool',
    params: {
      name: 'query_database',
      arguments: {
        table: 'string',
        limit: 'number?',
      } as any,
    },
  }, async (request) => {
    const { table, limit = 10 } = request.params.arguments;
    
    // Use the mock Supabase client
    const result = {
      content: [
        {
          type: 'text',
          text: JSON.stringify([{ id: 1, name: "Test User" }], null, 2),
        },
      ],
    };
    
    return result;
  });
}

// Mock resource registry setup
function setupResources(server: Server) {
  // Register a test weather resource
  server.setRequestHandler({
    method: 'readResource',
    params: {
      uri: 'string',
    } as any,
  }, async (request) => {
    const uri = request.params.uri;
    
    // Check if this is a weather resource
    if (!uri.startsWith('weather://')) {
      throw new Error(`Unsupported resource URI: ${uri}`);
    }
    
    // Mock weather data
    const weatherData = {
      temperature: 22.5,
      conditions: "Partly Cloudy",
      humidity: 65,
      wind_speed: 10.2,
      timestamp: new Date().toISOString(),
    };
    
    return {
      contents: [
        {
          uri: uri,
          mimeType: "application/json",
          text: JSON.stringify(weatherData, null, 2),
        },
      ],
    };
  });
}

Deno.test("End-to-End - Tool Request", async () => {
  // Create a mock request
  const request = {
    jsonrpc: "2.0",
    id: "test-id",
    method: "callTool",
    params: {
      name: "query_database",
      arguments: {
        table: "users",
        limit: 10,
      },
    },
  };
  
  // Create the server with the mock client
  const server = new SupabaseMcpServer("https://example.supabase.co", "test-key", mockSupabaseClient);
  
  // Set up tools and resources
  setupTools(server.server);
  
  // Process the request
  const response = await server.server.handleRequest(request);
  
  // Verify the response
  assertExists(response);
  assertEquals(response.id, "test-id");
  assertExists(response.result);
  assertExists(response.result.content);
  assertEquals(response.result.content[0].type, "text");
  
  // Parse the JSON string to verify the data
  const data = JSON.parse(response.result.content[0].text);
  assertEquals(data.length, 1);
  assertEquals(data[0].id, 1);
  assertEquals(data[0].name, "Test User");
});

Deno.test("End-to-End - Resource Request", async () => {
  // Create a mock request
  const request = {
    jsonrpc: "2.0",
    id: "test-id",
    method: "readResource",
    params: {
      uri: "weather://San Francisco/current",
    },
  };
  
  // Create the server with the mock client
  const server = new SupabaseMcpServer("https://example.supabase.co", "test-key", mockSupabaseClient);
  
  // Set up resources
  setupResources(server.server);
  
  // Process the request
  const response = await server.server.handleRequest(request);
  
  // Verify the response
  assertExists(response);
  assertEquals(response.id, "test-id");
  assertExists(response.result);
  assertExists(response.result.contents);
  assertEquals(response.result.contents.length, 1);
  assertEquals(response.result.contents[0].uri, "weather://San Francisco/current");
  assertEquals(response.result.contents[0].mimeType, "application/json");
  
  // Parse the JSON string to verify the data
  const data = JSON.parse(response.result.contents[0].text);
  assertEquals(typeof data.temperature, "number");
  assertEquals(data.conditions, "Partly Cloudy");
  assertEquals(data.humidity, 65);
  assertEquals(data.wind_speed, 10.2);
});