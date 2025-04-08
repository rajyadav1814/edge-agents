import { assertEquals, assertExists } from 'https://deno.land/std/testing/asserts.ts';

// Simple ToolRegistry class for testing
class ToolRegistry {
  private tools: Map<string, ToolHandler>;
  
  constructor() {
    this.tools = new Map();
  }
  
  registerTool(tool: ToolHandler) {
    this.tools.set(tool.name, tool);
  }
  
  getTool(name: string): ToolHandler | undefined {
    return this.tools.get(name);
  }
  
  getAllTools(): ToolHandler[] {
    return Array.from(this.tools.values());
  }
}

// Tool handler interface
interface ToolHandler {
  name: string;
  description: string;
  inputSchema: any;
  handler: (args: any) => Promise<any>;
}

Deno.test("ToolRegistry - Registration", () => {
  const registry = new ToolRegistry();
  
  const testTool: ToolHandler = {
    name: "test_tool",
    description: "A test tool",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => "test result",
  };
  
  registry.registerTool(testTool);
  const retrievedTool = registry.getTool("test_tool");
  assertExists(retrievedTool);
  assertEquals(retrievedTool.name, "test_tool");
});

Deno.test("ToolRegistry - Get All Tools", () => {
  const registry = new ToolRegistry();
  
  const testTool1: ToolHandler = {
    name: "test_tool_1",
    description: "A test tool 1",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => "test result 1",
  };
  
  const testTool2: ToolHandler = {
    name: "test_tool_2",
    description: "A test tool 2",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    handler: async () => "test result 2",
  };
  
  registry.registerTool(testTool1);
  registry.registerTool(testTool2);
  
  const allTools = registry.getAllTools();
  assertEquals(allTools.length, 2);
  assertEquals(allTools.map(t => t.name).sort(), ["test_tool_1", "test_tool_2"]);
});

Deno.test("ToolRegistry - Tool Not Found", () => {
  const registry = new ToolRegistry();
  const retrievedTool = registry.getTool("non_existent_tool");
  assertEquals(retrievedTool, undefined);
});