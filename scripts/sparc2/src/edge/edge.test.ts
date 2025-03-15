import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { spy, stub } from "https://deno.land/std@0.203.0/testing/mock.ts";
import { handleEdgeRequest } from "./edge.ts";
import * as config from "../config.ts";
import * as logger from "../logger.ts";
import { SPARC2Agent } from "../agent/agent.ts";

// Mock the logger to avoid actual logging during tests
const logMessageSpy = spy(logger, "logMessage");

// Setup and teardown for each test
function setupTest() {
  // Reset all spies
  logMessageSpy.calls = [];
  
  // Set environment variable for testing
  Deno.env.set("OPENAI_API_KEY", "test-api-key");
  Deno.env.set("GITHUB_TOKEN", "test-github-token");
  Deno.env.set("GITHUB_ORG", "test-org");
  Deno.env.set("EDGE_FUNCTION_URL", "https://test.com");
  Deno.env.set("E2B_API_KEY", "test-e2b-key");
  Deno.env.set("VECTOR_DB_URL", "https://test-vector.com");
}

function teardownTest() {
  // Restore original functions if they were stubbed
  Deno.env.delete("OPENAI_API_KEY");
  Deno.env.delete("GITHUB_TOKEN");
  Deno.env.delete("GITHUB_ORG");
  Deno.env.delete("EDGE_FUNCTION_URL");
  Deno.env.delete("E2B_API_KEY");
  Deno.env.delete("VECTOR_DB_URL");
}

// Create a mock SPARC2Agent
class MockSPARC2Agent {
  async init() {}
  async rollback() {}
  async createCheckpoint() { return "checkpoint-hash"; }
  async executeCode() { return { text: "Execution result", logs: { stdout: [], stderr: [] } }; }
  async planAndExecute() { 
    return [
      {
        path: "test.ts",
        originalContent: "function test() {}",
        newContent: "function test() { return true; }",
        diff: "- function test() {}\n+ function test() { return true; }",
        commitHash: "commit-hash"
      }
    ]; 
  }
  async isRepoClean() { return true; }
}

// Helper to create a mock request
function createMockRequest(method: string, path: string, body?: any): Request {
  const url = `https://example.com/${path}`;
  const options: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  return new Request(url, options);
}

Deno.test("Edge function handles OPTIONS request for CORS", async () => {
  setupTest();
  
  try {
    const req = new Request("https://example.com/", { method: "OPTIONS" });
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 200);
    assertEquals(await res.text(), "ok");
    assertEquals(res.headers.get("Access-Control-Allow-Origin"), "*");
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles rollback request", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "rollback", { target: "cp123" });
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 200);
    const data = await res.json();
    assertEquals(data.message, "Rollback to cp123 completed");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles rollback request with missing target", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "rollback", {});
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 400);
    const data = await res.json();
    assertEquals(data.error, "Target is required for rollback");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles checkpoint request", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "checkpoint", { name: "test-checkpoint" });
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 200);
    const data = await res.json();
    assertEquals(data.message, "Checkpoint test-checkpoint created");
    assertEquals(data.hash, "checkpoint-hash");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles checkpoint request with missing name", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "checkpoint", {});
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 400);
    const data = await res.json();
    assertEquals(data.error, "Name is required for checkpoint");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles execute request", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "execute", { code: "console.log('test')", language: "typescript" });
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 200);
    const data = await res.json();
    assertEquals(data.result.text, "Execution result");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles execute request with missing code", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "execute", { language: "typescript" });
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 400);
    const data = await res.json();
    assertEquals(data.error, "Code is required for execution");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles plan request", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "plan", { 
      description: "Update test function", 
      files: [
        { path: "test.ts", content: "function test() {}" }
      ] 
    });
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 200);
    const data = await res.json();
    assertEquals(data.results.length, 1);
    assertEquals(data.results[0].path, "test.ts");
    assertEquals(data.results[0].commitHash, "commit-hash");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles plan request with missing description", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "plan", { 
      files: [
        { path: "test.ts", content: "function test() {}" }
      ] 
    });
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 400);
    const data = await res.json();
    assertEquals(data.error, "Description is required for planning");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles plan request with missing files", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "plan", { description: "Update test function" });
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 400);
    const data = await res.json();
    assertEquals(data.error, "Files array is required for planning");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles plan request with invalid files format", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("POST", "plan", { 
      description: "Update test function", 
      files: [
        { path: "test.ts" } // Missing content
      ] 
    });
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 400);
    const data = await res.json();
    assertEquals(data.error, "Each file must have path and content properties");
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles status request", async () => {
  setupTest();
  
  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () => Promise.resolve({
      execution: {
        mode: "automatic",
        diff_mode: "file",
        processing: "parallel"
      },
      logging: {
        enable: true,
        vector_logging: true
      },
      rollback: {
        checkpoint_enabled: true,
        temporal_rollback: true
      },
      models: {
        reasoning: "test-model",
        instruct: "test-model"
      }
    }));
    
    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;
    
    const req = createMockRequest("GET", "status");
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 200);
    const data = await res.json();
    assertEquals(data.status, "ok");
    assertEquals(data.agent.model, "test-model");
    assertEquals(data.agent.mode, "automatic");
    assertEquals(data.agent.diffMode, "file");
    assertEquals(data.agent.processing, "parallel");
    assertEquals(data.repository.clean, true);
    
    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles unknown path", async () => {
  setupTest();
  
  try {
    const req = createMockRequest("GET", "unknown-path");
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 404);
    const data = await res.json();
    assertEquals(data.error, "Unknown path: unknown-path");
  } finally {
    teardownTest();
  }
});

Deno.test("Edge function handles errors gracefully", async () => {
  setupTest();
  
  try {
    // Stub loadConfig to throw an error
    const loadConfigStub = stub(config, "loadConfig", () => {
      throw new Error("Test error");
    });
    
    const req = createMockRequest("GET", "status");
    const res = await handleEdgeRequest(req);
    
    assertEquals(res.status, 500);
    const data = await res.json();
    assertEquals(data.error, "Test error");
    
    // Verify that an error was logged
    assertEquals(logMessageSpy.calls.length, 1);
    assertEquals(logMessageSpy.calls[0].args[0], "error");
    assertEquals(logMessageSpy.calls[0].args[1], "Edge function error");
    
    // Restore stubs
    loadConfigStub.restore();
  } finally {
    teardownTest();
  }
});