# Gemini Agent Testing Plan

This document outlines a comprehensive testing strategy for the Gemini agent and edge function implementation using Deno's testing framework. The plan follows the project's code quality standards defined in `.clinerules`, ensuring a minimum of 80% test coverage.

## Testing Framework

We'll use Deno's built-in testing capabilities along with the standard assertion library:

```typescript
import { 
  assertEquals, 
  assertExists, 
  assertStrictEquals, 
  assertThrows,
  assertRejects 
} from "https://deno.land/std/testing/asserts.ts";
```

## Test Organization

Tests will be organized in a structure that mirrors the source code:

```
tests/
├── agent/
│   ├── geminiAgent.test.ts
│   ├── geminiClient.test.ts
│   ├── contextManager.test.ts
│   └── toolManager.test.ts
├── edge/
│   └── geminiEdgeFunction.test.ts
├── integration/
│   ├── agent-edge-integration.test.ts
│   └── tool-execution-integration.test.ts
└── mocks/
    ├── mockGeminiClient.ts
    ├── mockContextManager.ts
    └── mockToolManager.ts
```

## Mock Strategy

To facilitate testing without external dependencies, we'll create comprehensive mocks:

1. **API Mocks**: Mock the Gemini API responses
2. **File System Mocks**: Mock file operations for testing tools
3. **Environment Mocks**: Mock environment variables

## Unit Tests

### 1. Agent Core Tests

#### 1.1 GeminiAgent Tests

```typescript
// File: tests/agent/geminiAgent.test.ts

Deno.test("GeminiAgent - initialization with valid config", async () => {
  const agent = new GeminiAgent();
  await agent.initialize(validMockConfig);
  
  assertEquals(agent.isInitialized(), true);
  assertEquals(agent.getContext().currentMode, "code");
});

Deno.test("GeminiAgent - initialization with invalid config", async () => {
  const agent = new GeminiAgent();
  await assertRejects(
    async () => {
      await agent.initialize({} as AgentConfig);
    },
    Error,
    "Invalid configuration"
  );
});

Deno.test("GeminiAgent - process without initialization", async () => {
  const agent = new GeminiAgent();
  await assertRejects(
    async () => {
      await agent.process("Test input");
    },
    Error,
    "Agent not initialized"
  );
});

Deno.test("GeminiAgent - process with valid input", async () => {
  const agent = new GeminiAgent();
  await agent.initialize(validMockConfig);
  
  const response = await agent.process("Implement a factorial function");
  
  assertExists(response);
  assertExists(response.content);
  assertEquals(response.mode, "code");
});

Deno.test("GeminiAgent - context updating", async () => {
  const agent = new GeminiAgent();
  await agent.initialize(validMockConfig);
  
  agent.updateContext({
    projectContext: {
      name: "Test Project",
      language: "TypeScript"
    }
  });
  
  const context = agent.getContext();
  assertEquals(context.projectContext?.name, "Test Project");
  assertEquals(context.projectContext?.language, "TypeScript");
});

Deno.test("GeminiAgent - mode switching based on intent", async () => {
  const agent = new GeminiAgent();
  await agent.initialize(validMockConfig);
  
  // Should switch to code mode
  await agent.process("Implement a sorting algorithm");
  assertEquals(agent.getContext().currentMode, "code");
  
  // Should switch to architect mode
  await agent.process("Design a system architecture");
  assertEquals(agent.getContext().currentMode, "architect");
  
  // Should stay in architect mode (no intent trigger)
  await agent.process("What do you think about this approach?");
  assertEquals(agent.getContext().currentMode, "architect");
});

Deno.test("GeminiAgent - explicit mode switching", async () => {
  const agent = new GeminiAgent();
  await agent.initialize(validMockConfig);
  
  agent.switchMode("document");
  assertEquals(agent.getContext().currentMode, "document");
  
  agent.switchMode("analyze");
  assertEquals(agent.getContext().currentMode, "analyze");
});

Deno.test("GeminiAgent - conversation history management", async () => {
  const agent = new GeminiAgent();
  await agent.initialize(validMockConfig);
  
  await agent.process("First message");
  await agent.process("Second message");
  
  const context = agent.getContext();
  assertEquals(context.conversation.length, 4); // 2 user messages + 2 assistant responses
  assertEquals(context.conversation[0].role, "user");
  assertEquals(context.conversation[0].content, "First message");
});

Deno.test("GeminiAgent - tool usage", async () => {
  const agent = new GeminiAgent();
  await agent.initialize(validMockConfig);
  
  // This input should trigger tool usage in our mock
  const response = await agent.process("Read the file src/main.ts");
  
  assertExists(response.toolResults);
  assertEquals(response.toolResults?.[0].toolName, "read_file");
});
```

#### 1.2 GeminiClient Tests

```typescript
// File: tests/agent/geminiClient.test.ts

Deno.test("GeminiClient - initialization", () => {
  const client = new GeminiClient(validMockConfig);
  assertExists(client);
});

Deno.test("GeminiClient - generateResponse with text input", async () => {
  const client = new GeminiClient(validMockConfig);
  
  // Mock fetch to return a valid response
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ text: "Test response" }]
        }
      }]
    }), { status: 200 });
  };
  
  const response = await client.generateResponse(
    "Test input",
    {},
    []
  );
  
  assertEquals(response.content, "Test response");
  assertExists(response.usage);
});

Deno.test("GeminiClient - generateResponse with tool calls", async () => {
  const client = new GeminiClient(validMockConfig);
  
  // Mock fetch to return a response with function call
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      candidates: [{
        content: {
          parts: [{ 
            text: "I'll read that file for you",
            functionCall: {
              name: "read_file",
              args: JSON.stringify({ path: "src/main.ts" })
            }
          }]
        }
      }]
    }), { status: 200 });
  };
  
  const response = await client.generateResponse(
    "Read the file src/main.ts",
    {},
    [{ name: "read_file", description: "Read file contents", parameters: [] }]
  );
  
  assertEquals(response.content, "I'll read that file for you");
  assertExists(response.toolCalls);
  assertEquals(response.toolCalls?.[0].toolName, "read_file");
  assertEquals(response.toolCalls?.[0].parameters.path, "src/main.ts");
});

Deno.test("GeminiClient - API error handling", async () => {
  const client = new GeminiClient(validMockConfig);
  
  // Mock fetch to return an error
  globalThis.fetch = async () => {
    return new Response(JSON.stringify({
      error: {
        message: "Invalid API key"
      }
    }), { status: 401 });
  };
  
  await assertRejects(
    async () => {
      await client.generateResponse("Test input", {}, []);
    },
    Error,
    "Gemini API error: Invalid API key"
  );
});
```

#### 1.3 ContextManager Tests

```typescript
// File: tests/agent/contextManager.test.ts

Deno.test("ContextManager - prepareContext", () => {
  const manager = new ContextManager();
  const context = mockAgentContext();
  
  const prepared = manager.prepareContext(context);
  
  assertExists(prepared);
  assertExists(prepared.conversation);
  assertExists(prepared.memory);
});

Deno.test("ContextManager - trimConversation", () => {
  const manager = new ContextManager();
  
  // Create a conversation with 10 entries
  const conversation = Array(10).fill(0).map((_, i) => ({
    role: "user" as const,
    content: `Message ${i}`,
    timestamp: Date.now() + i
  }));
  
  // Trim to fit within 5 "tokens" (assuming 1 token per character)
  const trimmed = manager.trimConversation(conversation, 5);
  
  // Should only keep the most recent messages that fit
  assert(trimmed.length < 10);
  assertEquals(trimmed[trimmed.length - 1].content, "Message 9");
});

Deno.test("ContextManager - extractRelevantMemory for code mode", () => {
  const manager = new ContextManager();
  const memory = {
    decisions: [
      { category: "code", content: "Use TypeScript" },
      { category: "architecture", content: "Use microservices" }
    ],
    codeContext: [{ file: "main.ts", content: "console.log('hello')" }],
    projectKnowledge: [
      { category: "code", content: "TypeScript best practices" },
      { category: "design", content: "UI/UX guidelines" }
    ]
  };
  
  const relevant = manager.extractRelevantMemory(memory, "code");
  
  assertEquals(relevant.decisions.length, 1);
  assertEquals(relevant.decisions[0].content, "Use TypeScript");
  assertEquals(relevant.projectKnowledge.length, 1);
  assertEquals(relevant.projectKnowledge[0].content, "TypeScript best practices");
});
```

### 2. Edge Function Tests

```typescript
// File: tests/edge/geminiEdgeFunction.test.ts

Deno.test("EdgeFunction - valid request handling", async () => {
  // Mock environment
  Deno.env.set("GEMINI_API_KEY", "test-api-key");
  
  const request = new Request("https://example.com/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: "Implement a factorial function"
    })
  });
  
  const response = await handleRequest(request);
  
  assertEquals(response.status, 200);
  
  const data = await response.json();
  assertExists(data.response);
  assertExists(data.response.content);
  assertExists(data.metadata);
  assertExists(data.metadata.requestId);
});

Deno.test("EdgeFunction - method not allowed", async () => {
  const request = new Request("https://example.com/agent", {
    method: "GET"
  });
  
  const response = await handleRequest(request);
  
  assertEquals(response.status, 405);
  
  const data = await response.json();
  assertExists(data.error);
  assertEquals(data.error.code, "405");
  assertEquals(data.error.message, "Method Not Allowed");
});

Deno.test("EdgeFunction - invalid JSON", async () => {
  const request = new Request("https://example.com/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not json"
  });
  
  const response = await handleRequest(request);
  
  assertEquals(response.status, 400);
  
  const data = await response.json();
  assertExists(data.error);
  assertEquals(data.error.code, "400");
});

Deno.test("EdgeFunction - missing input field", async () => {
  const request = new Request("https://example.com/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  
  const response = await handleRequest(request);
  
  assertEquals(response.status, 400);
  
  const data = await response.json();
  assertExists(data.error);
  assertEquals(data.error.code, "400");
  assertEquals(data.error.message, "Bad Request");
});

Deno.test("EdgeFunction - missing API key", async () => {
  // Remove API key from environment
  Deno.env.delete("GEMINI_API_KEY");
  
  const request = new Request("https://example.com/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: "Test input"
    })
  });
  
  const response = await handleRequest(request);
  
  assertEquals(response.status, 500);
  
  const data = await response.json();
  assertExists(data.error);
  assertEquals(data.error.code, "500");
  assertEquals(data.error.message, "Server Error");
});

Deno.test("EdgeFunction - custom configuration", async () => {
  // Restore API key
  Deno.env.set("GEMINI_API_KEY", "test-api-key");
  
  const request = new Request("https://example.com/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: "Test input",
      config: {
        temperature: 0.5,
        topP: 0.8,
        defaultMode: "architect"
      }
    })
  });
  
  const response = await handleRequest(request);
  
  assertEquals(response.status, 200);
  
  const data = await response.json();
  assertEquals(data.response.mode, "architect");
});
```

## Integration Tests

### 1. Agent-Edge Integration

```typescript
// File: tests/integration/agent-edge-integration.test.ts

Deno.test("Integration - end-to-end request processing", async () => {
  // Set up environment
  Deno.env.set("GEMINI_API_KEY", "test-api-key");
  
  // Create a request
  const request = new Request("https://example.com/agent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: "Implement a function to calculate the Fibonacci sequence",
      config: {
        temperature: 0.5
      },
      context: {
        projectContext: {
          name: "Algorithm Library",
          language: "TypeScript"
        }
      }
    })
  });
  
  // Process the request through the edge function
  const response = await handleRequest(request);
  assertEquals(response.status, 200);
  
  // Parse the response
  const responseData = await response.json();
  assertExists(responseData.response);
  assertExists(responseData.response.content);
  assertEquals(responseData.response.mode, "code");
  
  // Verify metadata
  assertExists(responseData.metadata);
  assertExists(responseData.metadata.requestId);
  assertExists(responseData.metadata.processingTime);
});
```

### 2. Tool Execution Integration

```typescript
// File: tests/integration/tool-execution-integration.test.ts

Deno.test("Integration - tool execution flow", async () => {
  // Set up environment
  Deno.env.set("GEMINI_API_KEY", "test-api-key");
  
  // Initialize agent directly
  const agent = new GeminiAgent();
  await agent.initialize({
    apiKey: "test-api-key",
    modelProvider: "google/gemini-2.5-pro-experimental",
    defaultMode: "code",
    tools: [
      {
        name: "read_file",
        description: "Read file contents",
        parameters: [
          {
            name: "path",
            type: "string",
            description: "File path",
            required: true
          }
        ]
      }
    ]
  });
  
  // Process a request that should trigger tool usage
  const response = await agent.process("Read the file src/main.ts");
  
  // Verify tool was called
  assertExists(response.toolResults);
  assertEquals(response.toolResults?.[0].toolName, "read_file");
  assertEquals(response.toolResults?.[0].metadata?.path, "src/main.ts");
  
  // Verify response incorporates tool results
  assert(response.content.includes("file") || response.content.includes("content"));
});
```

## Mock Implementations

### 1. Gemini Client Mock

```typescript
// File: tests/mocks/mockGeminiClient.ts

export class MockGeminiClient {
  async generateResponse(prompt: string, context: any, tools: any[]): Promise<any> {
    // Simple mock that returns different responses based on the prompt
    if (prompt.includes("factorial")) {
      return {
        content: "Here is a factorial function implementation:\n\n```typescript\nfunction factorial(n: number): number {\n  if (n <= 1) return 1;\n  return n * factorial(n - 1);\n}\n```",
        usage: {
          promptTokens: 100,
          completionTokens: 50,
          totalTokens: 150
        }
      };
    }
    
    if (prompt.includes("fibonacci")) {
      return {
        content: "Here is a Fibonacci sequence implementation:\n\n```typescript\nfunction fibonacci(n: number): number {\n  if (n <= 1) return n;\n  return fibonacci(n - 1) + fibonacci(n - 2);\n}\n```",
        usage: {
          promptTokens: 120,
          completionTokens: 60,
          totalTokens: 180
        }
      };
    }
    
    if (prompt.includes("Read the file") || prompt.includes("read_file")) {
      return {
        content: "I need to read a file. Let me use the read_file tool.",
        toolCalls: [
          {
            toolName: "read_file",
            parameters: {
              path: prompt.includes("src/main.ts") ? "src/main.ts" : "unknown.ts"
            }
          }
        ],
        usage: {
          promptTokens: 80,
          completionTokens: 30,
          totalTokens: 110
        }
      };
    }
    
    // Default response
    return {
      content: "I understand your request and will help you with that.",
      usage: {
        promptTokens: 50,
        completionTokens: 20,
        totalTokens: 70
      }
    };
  }
}
```

### 2. Tool Manager Mock

```typescript
// File: tests/mocks/mockToolManager.ts

export class MockToolManager {
  getDefaultToolNames(): string[] {
    return ["read_file", "write_to_file", "list_files", "execute_command"];
  }
  
  getToolsForMode(mode: string): any[] {
    switch (mode) {
      case "code":
        return [
          { name: "read_file", description: "Read file contents" },
          { name: "write_to_file", description: "Write to a file" },
          { name: "list_files", description: "List directory contents" },
          { name: "execute_command", description: "Execute a command" }
        ];
      case "architect":
        return [
          { name: "read_file", description: "Read file contents" },
          { name: "list_files", description: "List directory contents" }
        ];
      default:
        return [];
    }
  }
  
  async executeToolCalls(toolCalls: any[]): Promise<any[]> {
    return toolCalls.map(call => {
      if (call.toolName === "read_file") {
        return {
          toolName: "read_file",
          result: "console.log('Hello, world!');",
          metadata: { path: call.parameters.path }
        };
      }
      
      if (call.toolName === "write_to_file") {
        return {
          toolName: "write_to_file",
          result: "File written successfully",
          metadata: { path: call.parameters.path }
        };
      }
      
      if (call.toolName === "list_files") {
        return {
          toolName: "list_files",
          result: ["file1.ts", "file2.ts", "file3.md"],
          metadata: { path: call.parameters.path }
        };
      }
      
      if (call.toolName === "execute_command") {
        return {
          toolName: "execute_command",
          result: "Command executed successfully",
          metadata: { command: call.parameters.command }
        };
      }
      
      return {
        toolName: call.toolName,
        result: null,
        error: "Unknown tool"
      };
    });
  }
}
```

## Test Execution

### Running Tests

Tests will be executed using Deno's test runner:

```bash
# Run all tests
deno test --allow-env --allow-net tests/

# Run specific test file
deno test --allow-env --allow-net tests/agent/geminiAgent.test.ts

# Run tests with coverage
deno test --coverage=coverage --allow-env --allow-net tests/
deno coverage coverage
```

### CI Integration

Tests will be integrated into the CI pipeline to ensure code quality:

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.30.x
      - name: Run tests
        run: deno test --allow-env --allow-net tests/
      - name: Check coverage
        run: |
          deno test --coverage=coverage --allow-env --allow-net tests/
          deno coverage coverage --lcov > coverage.lcov
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.lcov
```

## Test Coverage Goals

Following the `.clinerules` requirements:

- Minimum test coverage: 80%
- Focus areas:
  - Core agent functionality: 90%
  - Edge function handler: 90%
  - Tool execution: 85%
  - Context management: 80%
  - Error handling: 90%

## Conclusion

This testing plan provides a comprehensive approach to ensuring the quality and reliability of the Gemini agent and edge function implementation. By following this plan, we can achieve the required test coverage and maintain a robust codebase.