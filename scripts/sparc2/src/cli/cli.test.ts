import {
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { assertSpyCalls, spy, stub } from "https://deno.land/std@0.203.0/testing/mock.ts";
import { main } from "./cli.ts";
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

// Mock console.log and console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
let consoleOutput: string[] = [];
let consoleErrors: string[] = [];

function mockConsole() {
  console.log = (...args: any[]) => {
    consoleOutput.push(args.join(" "));
  };
  console.error = (...args: any[]) => {
    consoleErrors.push(args.join(" "));
  };
}

function restoreConsole() {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
}

function clearConsoleOutput() {
  consoleOutput = [];
  consoleErrors = [];
}

// Mock Deno.exit
const originalDenoExit = Deno.exit;
let exitCalled = false;
let exitCode = 0;

function mockDenoExit() {
  Deno.exit = (code?: number) => {
    exitCalled = true;
    exitCode = code || 0;
    return originalDenoExit(0); // This won't actually be called in tests
  };
}

function restoreDenoExit() {
  Deno.exit = originalDenoExit;
}

function resetExitStatus() {
  exitCalled = false;
  exitCode = 0;
}

// Mock Deno.args
let mockArgs: string[] = [];

function setMockArgs(args: string[]) {
  mockArgs = args;
  // @ts-ignore - Mocking Deno.args for testing
  Deno.args = mockArgs;
}

// Create a mock SPARC2Agent
class MockSPARC2Agent {
  async init() {}
  async rollback() {}
  async createCheckpoint() {
    return "checkpoint-hash";
  }
  async executeCode() {
    return { text: "Execution result", logs: { stdout: [], stderr: [] } };
  }
  async planAndExecute() {
    return [];
  }
}

Deno.test("CLI displays help when --help flag is provided", async () => {
  setupTest();
  mockConsole();

  try {
    setMockArgs(["--help"]);
    await main();

    // Verify that help was displayed
    assertEquals(consoleOutput.length > 0, true);
    assertStringIncludes(consoleOutput[0], "SPARC 2.0 CLI Help");
  } finally {
    teardownTest();
    restoreConsole();
  }
});

Deno.test("CLI displays help when -h flag is provided", async () => {
  setupTest();
  mockConsole();

  try {
    setMockArgs(["-h"]);
    await main();

    // Verify that help was displayed
    assertEquals(consoleOutput.length > 0, true);
    assertStringIncludes(consoleOutput[0], "SPARC 2.0 CLI Help");
  } finally {
    teardownTest();
    restoreConsole();
  }
});

Deno.test("CLI loads config from specified path", async () => {
  setupTest();

  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () =>
      Promise.resolve({
        execution: {
          mode: "automatic",
          diff_mode: "file",
          processing: "parallel",
        },
        logging: {
          enable: true,
          vector_logging: true,
        },
        rollback: {
          checkpoint_enabled: true,
          temporal_rollback: true,
        },
        models: {
          reasoning: "test-model",
          instruct: "test-model",
        },
      }));

    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;

    setMockArgs(["--config", "test-config.toml", "--help"]);
    await main();

    // Verify that loadConfig was called with the correct path
    assertSpyCalls(loadConfigStub, 1);
    assertEquals(loadConfigStub.calls[0].args[0], "test-config.toml");

    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
  }
});

Deno.test("CLI handles rollback command", async () => {
  setupTest();
  mockConsole();

  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () =>
      Promise.resolve({
        execution: {
          mode: "automatic",
          diff_mode: "file",
          processing: "parallel",
        },
        logging: {
          enable: true,
          vector_logging: true,
        },
        rollback: {
          checkpoint_enabled: true,
          temporal_rollback: true,
        },
        models: {
          reasoning: "test-model",
          instruct: "test-model",
        },
      }));

    // Create a spy for rollback
    const rollbackSpy = spy();

    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = class {
      async init() {}
      async rollback(...args: any[]) {
        rollbackSpy(...args);
      }
    };

    setMockArgs(["--rollback", "cp123"]);
    await main();

    // Verify that rollback was called with the correct arguments
    assertEquals(rollbackSpy.calls.length, 1);
    assertEquals(rollbackSpy.calls[0].args[0], "cp123");
    assertEquals(rollbackSpy.calls[0].args[1], "checkpoint");

    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);

    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
    restoreConsole();
  }
});

Deno.test("CLI handles checkpoint creation", async () => {
  setupTest();
  mockConsole();

  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () =>
      Promise.resolve({
        execution: {
          mode: "automatic",
          diff_mode: "file",
          processing: "parallel",
        },
        logging: {
          enable: true,
          vector_logging: true,
        },
        rollback: {
          checkpoint_enabled: true,
          temporal_rollback: true,
        },
        models: {
          reasoning: "test-model",
          instruct: "test-model",
        },
      }));

    // Create a spy for createCheckpoint
    const createCheckpointSpy = spy(() => Promise.resolve("checkpoint-hash"));

    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = class {
      async init() {}
      async createCheckpoint(...args: any[]) {
        return createCheckpointSpy(...args);
      }
    };

    setMockArgs(["--checkpoint", "test-checkpoint"]);
    await main();

    // Verify that createCheckpoint was called with the correct arguments
    assertEquals(createCheckpointSpy.calls.length, 1);
    assertEquals(createCheckpointSpy.calls[0].args[0], "test-checkpoint");

    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);

    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
    restoreConsole();
  }
});

Deno.test("CLI handles code execution", async () => {
  setupTest();
  mockConsole();

  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () =>
      Promise.resolve({
        execution: {
          mode: "automatic",
          diff_mode: "file",
          processing: "parallel",
        },
        logging: {
          enable: true,
          vector_logging: true,
        },
        rollback: {
          checkpoint_enabled: true,
          temporal_rollback: true,
        },
        models: {
          reasoning: "test-model",
          instruct: "test-model",
        },
      }));

    // Create a spy for executeCode
    const executeCodeSpy = spy(() =>
      Promise.resolve({
        text: "Execution result",
        logs: { stdout: [], stderr: [] },
      })
    );

    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = class {
      async init() {}
      async executeCode(...args: any[]) {
        return executeCodeSpy(...args);
      }
    };

    setMockArgs(["--execute", "console.log('Hello')", "--language", "typescript"]);
    await main();

    // Verify that executeCode was called with the correct arguments
    assertEquals(executeCodeSpy.calls.length, 1);
    assertEquals(executeCodeSpy.calls[0].args[0], "console.log('Hello')");
    assertEquals(executeCodeSpy.calls[0].args[1].language, "typescript");

    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);

    // Verify that the execution result was displayed
    assertStringIncludes(consoleOutput.join("\n"), "Execution result");

    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
    restoreConsole();
  }
});

Deno.test("CLI handles plan and execute", async () => {
  setupTest();
  mockConsole();

  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () =>
      Promise.resolve({
        execution: {
          mode: "automatic",
          diff_mode: "file",
          processing: "parallel",
        },
        logging: {
          enable: true,
          vector_logging: true,
        },
        rollback: {
          checkpoint_enabled: true,
          temporal_rollback: true,
        },
        models: {
          reasoning: "test-model",
          instruct: "test-model",
        },
      }));

    // Stub Deno.readTextFile
    const readTextFileStub = stub(Deno, "readTextFile", () => Promise.resolve("Test file content"));

    // Create a spy for planAndExecute
    const planAndExecuteSpy = spy(() =>
      Promise.resolve([
        {
          path: "test.ts",
          originalContent: "function test() {}",
          newContent: "function test() { return true; }",
          diff: "- function test() {}\n+ function test() { return true; }",
          commitHash: "commit-hash",
        },
      ])
    );

    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = class {
      async init() {}
      async planAndExecute(...args: any[]) {
        return planAndExecuteSpy(...args);
      }
    };

    setMockArgs(["--plan", "Update test function", "--files", "test.ts,test2.ts"]);
    await main();

    // Verify that readTextFile was called for each file
    assertSpyCalls(readTextFileStub, 2);

    // Verify that planAndExecute was called with the correct arguments
    assertEquals(planAndExecuteSpy.calls.length, 1);
    assertEquals(planAndExecuteSpy.calls[0].args[0], "Update test function");
    assertEquals(planAndExecuteSpy.calls[0].args[1].length, 2);
    assertEquals(planAndExecuteSpy.calls[0].args[1][0].path, "test.ts");
    assertEquals(planAndExecuteSpy.calls[0].args[1][0].content, "Test file content");

    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);

    // Verify that the results were displayed
    assertStringIncludes(consoleOutput.join("\n"), "Plan execution completed");
    assertStringIncludes(consoleOutput.join("\n"), "test.ts");
    assertStringIncludes(consoleOutput.join("\n"), "commit-hash");

    // Restore stubs
    loadConfigStub.restore();
    readTextFileStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
    restoreConsole();
  }
});

Deno.test("CLI shows error when --files is missing with --plan", async () => {
  setupTest();
  mockConsole();
  mockDenoExit();

  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () =>
      Promise.resolve({
        execution: {
          mode: "automatic",
          diff_mode: "file",
          processing: "parallel",
        },
        logging: {
          enable: true,
          vector_logging: true,
        },
        rollback: {
          checkpoint_enabled: true,
          temporal_rollback: true,
        },
        models: {
          reasoning: "test-model",
          instruct: "test-model",
        },
      }));

    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;

    setMockArgs(["--plan", "Update test function"]);
    await main();

    // Verify that an error was displayed
    assertStringIncludes(consoleErrors.join("\n"), "--files argument is required");

    // Verify that exit was called
    assertEquals(exitCalled, true);
    assertEquals(exitCode, 1);

    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
    restoreConsole();
    restoreDenoExit();
    resetExitStatus();
  }
});

Deno.test("CLI handles errors gracefully", async () => {
  setupTest();
  mockConsole();
  mockDenoExit();

  try {
    // Stub loadConfig to throw an error
    const loadConfigStub = stub(config, "loadConfig", () => {
      throw new Error("Test error");
    });

    setMockArgs(["--help"]);
    await main();

    // Verify that an error was logged
    assertSpyCalls(logMessageSpy, 1);
    assertEquals(logMessageSpy.calls[0].args[0], "error");
    assertEquals(logMessageSpy.calls[0].args[1], "CLI error");

    // Verify that an error was displayed
    assertStringIncludes(consoleErrors.join("\n"), "Test error");

    // Verify that exit was called
    assertEquals(exitCalled, true);
    assertEquals(exitCode, 1);

    // Restore stubs
    loadConfigStub.restore();
  } finally {
    teardownTest();
    restoreConsole();
    restoreDenoExit();
    resetExitStatus();
  }
});

Deno.test("CLI displays help when no valid command is provided", async () => {
  setupTest();
  mockConsole();

  try {
    // Stub loadConfig
    const loadConfigStub = stub(config, "loadConfig", () =>
      Promise.resolve({
        execution: {
          mode: "automatic",
          diff_mode: "file",
          processing: "parallel",
        },
        logging: {
          enable: true,
          vector_logging: true,
        },
        rollback: {
          checkpoint_enabled: true,
          temporal_rollback: true,
        },
        models: {
          reasoning: "test-model",
          instruct: "test-model",
        },
      }));

    // Stub SPARC2Agent
    const originalSPARC2Agent = SPARC2Agent;
    // @ts-ignore - Mocking for testing
    globalThis.SPARC2Agent = MockSPARC2Agent;

    setMockArgs(["--model", "test-model"]);
    await main();

    // Verify that help was displayed
    assertStringIncludes(consoleOutput.join("\n"), "No valid command provided");
    assertStringIncludes(consoleOutput.join("\n"), "SPARC 2.0 CLI Help");

    // Restore stubs
    loadConfigStub.restore();
    // @ts-ignore - Restoring original
    globalThis.SPARC2Agent = originalSPARC2Agent;
  } finally {
    teardownTest();
    restoreConsole();
  }
});
