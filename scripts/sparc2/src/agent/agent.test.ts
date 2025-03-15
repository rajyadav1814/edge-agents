import { assertEquals, assertRejects, assertStringIncludes } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { spy, stub, assertSpyCalls } from "https://deno.land/std@0.203.0/testing/mock.ts";
import { SPARC2Agent, AgentOptions, FileToProcess } from "./agent.ts";
import * as logger from "../logger.ts";
import * as diffTracker from "../diff/diffTracker.ts";
import * as gitIntegration from "../git/gitIntegration.ts";
import * as vectorStore from "../vector/vectorStore.ts";

// Mock the logger to avoid actual logging during tests
const logMessageSpy = { calls: [] };
// Override the _vectorStoreLogImpl to avoid actual vector store calls
logger._vectorStoreLogImpl = async () => {};
// Create a mock implementation of logMessage
const originalLogMessage = logger.logMessage;
logger.logMessage = async (level: logger.LogLevel, message: string, metadata = {}) => {
  logMessageSpy.calls.push({ args: [level, message, metadata] });
};

// Mock OpenAI
class MockOpenAI {
  chat = {
    completions: {
      create: async () => ({
        choices: [
          {
            message: {
              content: `
Analysis:
The code looks good, but there are some improvements to be made.

Plan:
1. Update the function to handle edge cases
2. Add better error handling
3. Improve performance

File: test.ts
\`\`\`typescript
function hello(name: string): string {
  if (!name) {
    return "Hello, world!";
  }
  return \`Hello, \${name}!\`;
}
\`\`\`
`
            }
          }
        ],
        usage: {
          completion_tokens: 100,
          prompt_tokens: 200,
          total_tokens: 300
        }
      })
    }
  };

  constructor() {}
}

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
  
  // Restore original logMessage function
  logger.logMessage = originalLogMessage;
}

// Create test agent options
const testAgentOptions: AgentOptions = {
  model: "gpt-4o-mini",
  mode: "automatic",
  diffMode: "file",
  processing: "parallel"
};

// Create test files
const testFiles: FileToProcess[] = [
  {
    path: "test.ts",
    content: "function hello() { return 'Hello, world!'; }"
  }
];

Deno.test("SPARC2Agent initialization", async () => {
  setupTest();
  
  try {
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    // Verify that the logger was called
    assertEquals(logMessageSpy.calls.length, 1);
  } finally {
    teardownTest();
  }
});

Deno.test("SPARC2Agent analyzeAndDiff should compute diff", async () => {
  setupTest();
  
  try {
    // Spy on computeDiff
    const computeDiffSpy = spy(diffTracker, "computeDiff");
    
    // Spy on indexDiffEntry
    const indexDiffEntrySpy = spy(vectorStore, "indexDiffEntry");
    
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    const oldContent = "function hello() { return 'Hello, world!'; }";
    const newContent = "function hello(name: string) { return `Hello, ${name}!`; }";
    
    const diff = await agent.analyzeAndDiff("test.ts", oldContent, newContent);
    
    // Verify that computeDiff was called with the correct arguments
    assertSpyCalls(computeDiffSpy, 1);
    assertEquals(computeDiffSpy.calls[0].args[0], oldContent);
    assertEquals(computeDiffSpy.calls[0].args[1], newContent);
    assertEquals(computeDiffSpy.calls[0].args[2], "file");
    
    // Verify that indexDiffEntry was called
    assertSpyCalls(indexDiffEntrySpy, 1);
    
    // Verify that the logger was called
    assertEquals(logMessageSpy.calls.length, 2); // 1 for init, 1 for analyzeAndDiff
    
    // Restore the spy
    computeDiffSpy.restore();
    indexDiffEntrySpy.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("SPARC2Agent analyzeAndDiff should not index if no changes", async () => {
  setupTest();
  
  try {
    // Stub computeDiff to return no changes
    const computeDiffStub = stub(diffTracker, "computeDiff", () => ({
      diffText: "",
      changedLines: 0,
      hunks: []
    }));
    
    // Spy on indexDiffEntry
    const indexDiffEntrySpy = spy(vectorStore, "indexDiffEntry");
    
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    const content = "function hello() { return 'Hello, world!'; }";
    
    const diff = await agent.analyzeAndDiff("test.ts", content, content);
    
    // Verify that indexDiffEntry was not called
    assertSpyCalls(indexDiffEntrySpy, 0);
    
    // Verify that the logger was called with the correct message
    assertEquals(logMessageSpy.calls.length, 2); // 1 for init, 1 for analyzeAndDiff
    assertEquals(logMessageSpy.calls[1].args[0], "info");
    assertEquals(logMessageSpy.calls[1].args[1], "No changes detected for test.ts");
    
    // Restore the stub and spy
    computeDiffStub.restore();
    indexDiffEntrySpy.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("SPARC2Agent applyChanges should commit changes", async () => {
  setupTest();
  
  try {
    // Stub getCurrentBranch
    const getCurrentBranchStub = stub(gitIntegration, "getCurrentBranch", () => Promise.resolve("main"));
    
    // Stub createCommit
    const createCommitStub = stub(gitIntegration, "createCommit", () => Promise.resolve("commit-hash"));
    
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    const commitHash = await agent.applyChanges("test.ts", "Test commit");
    
    // Verify that getCurrentBranch was called
    assertSpyCalls(getCurrentBranchStub, 1);
    
    // Verify that createCommit was called with the correct arguments
    assertSpyCalls(createCommitStub, 1);
    assertEquals(createCommitStub.calls[0].args[0], "main");
    assertEquals(createCommitStub.calls[0].args[1], "test.ts");
    assertEquals(createCommitStub.calls[0].args[2], "Test commit");
    
    // Verify that the logger was called
    assertEquals(logMessageSpy.calls.length, 2); // 1 for init, 1 for applyChanges
    
    // Verify the return value
    assertEquals(commitHash, "commit-hash");
    
    // Restore the stubs
    getCurrentBranchStub.restore();
    createCommitStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("SPARC2Agent createCheckpoint should create a checkpoint", async () => {
  setupTest();
  
  try {
    // Stub createCheckpoint
    const createCheckpointStub = stub(gitIntegration, "createCheckpoint", () => Promise.resolve("checkpoint-hash"));
    
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    const hash = await agent.createCheckpoint("test-checkpoint");
    
    // Verify that createCheckpoint was called with the correct arguments
    assertSpyCalls(createCheckpointStub, 1);
    assertEquals(createCheckpointStub.calls[0].args[0], "test-checkpoint");
    
    // Verify that the logger was called
    assertEquals(logMessageSpy.calls.length, 2); // 1 for init, 1 for createCheckpoint
    
    // Verify the return value
    assertEquals(hash, "checkpoint-hash");
    
    // Restore the stub
    createCheckpointStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("SPARC2Agent rollback should rollback changes", async () => {
  setupTest();
  
  try {
    // Stub rollbackChanges
    const rollbackChangesStub = stub(gitIntegration, "rollbackChanges", () => Promise.resolve());
    
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    await agent.rollback("test-target", "checkpoint");
    
    // Verify that rollbackChanges was called with the correct arguments
    assertSpyCalls(rollbackChangesStub, 1);
    assertEquals(rollbackChangesStub.calls[0].args[0], "test-target");
    assertEquals(rollbackChangesStub.calls[0].args[1], "checkpoint");
    
    // Verify that the logger was called
    assertEquals(logMessageSpy.calls.length, 2); // 1 for init, 1 for rollback
    
    // Restore the stub
    rollbackChangesStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("SPARC2Agent isRepoClean should check if repo is clean", async () => {
  setupTest();
  
  try {
    // Stub isRepoClean
    const isRepoCleanStub = stub(gitIntegration, "isRepoClean", () => Promise.resolve(true));
    
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    const isClean = await agent.isRepoClean();
    
    // Verify that isRepoClean was called
    assertSpyCalls(isRepoCleanStub, 1);
    
    // Verify the return value
    assertEquals(isClean, true);
    
    // Restore the stub
    isRepoCleanStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("SPARC2Agent planAndExecute should execute a task", async () => {
  setupTest();
  
  try {
    // Stub isRepoClean
    const isRepoCleanStub = stub(gitIntegration, "isRepoClean", () => Promise.resolve(true));
    
    // Stub Deno.writeTextFile
    const writeTextFileStub = stub(Deno, "writeTextFile", () => Promise.resolve());
    
    // Create a mock OpenAI instance
    const mockOpenAI = new MockOpenAI();
    
    // Create an agent with the mock OpenAI instance
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    // Replace the OpenAI instance with our mock
    // @ts-ignore - Accessing private property for testing
    agent.openai = mockOpenAI;
    
    // Stub analyzeAndDiff to return a diff
    const analyzeAndDiffStub = stub(
      agent,
      "analyzeAndDiff",
      () => Promise.resolve("- function hello() { return 'Hello, world!'; }\n+ function hello(name: string) { return `Hello, ${name}!`; }")
    );
    
    // Stub applyChanges to return a commit hash
    const applyChangesStub = stub(
      agent,
      "applyChanges",
      () => Promise.resolve("commit-hash")
    );
    
    const results = await agent.planAndExecute("Update hello function", testFiles);
    
    // Verify that isRepoClean was called
    assertSpyCalls(isRepoCleanStub, 1);
    
    // Verify that analyzeAndDiff was called
    assertSpyCalls(analyzeAndDiffStub, 1);
    
    // Verify that writeTextFile was called
    assertSpyCalls(writeTextFileStub, 1);
    
    // Verify that applyChanges was called
    assertSpyCalls(applyChangesStub, 1);
    
    // Verify the results
    assertEquals(results.length, 1);
    assertEquals(results[0].path, "test.ts");
    assertEquals(results[0].originalContent, "function hello() { return 'Hello, world!'; }");
    assertEquals(results[0].newContent, "function hello(name: string) {\n  if (!name) {\n    return \"Hello, world!\";\n  }\n  return `Hello, ${name}!`;\n}");
    assertEquals(results[0].commitHash, "commit-hash");
    
    // Restore the stubs
    isRepoCleanStub.restore();
    writeTextFileStub.restore();
    analyzeAndDiffStub.restore();
    applyChangesStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("SPARC2Agent planAndExecute should create checkpoint if repo is not clean", async () => {
  setupTest();
  
  try {
    // Stub isRepoClean to return false
    const isRepoCleanStub = stub(gitIntegration, "isRepoClean", () => Promise.resolve(false));
    
    // Stub createCheckpoint
    const createCheckpointStub = stub(
      gitIntegration,
      "createCheckpoint",
      () => Promise.resolve("checkpoint-hash")
    );
    
    // Create a mock OpenAI instance
    const mockOpenAI = new MockOpenAI();
    
    // Create an agent with the mock OpenAI instance
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    // Replace the OpenAI instance with our mock
    // @ts-ignore - Accessing private property for testing
    agent.openai = mockOpenAI;
    
    // Stub other methods to avoid actual execution
    const analyzeAndDiffStub = stub(
      agent,
      "analyzeAndDiff",
      () => Promise.resolve("")
    );
    
    const writeTextFileStub = stub(Deno, "writeTextFile", () => Promise.resolve());
    
    const applyChangesStub = stub(
      agent,
      "applyChanges",
      () => Promise.resolve("commit-hash")
    );
    
    await agent.planAndExecute("Update hello function", testFiles);
    
    // Verify that isRepoClean was called
    assertSpyCalls(isRepoCleanStub, 1);
    
    // Verify that createCheckpoint was called
    assertSpyCalls(createCheckpointStub, 1);
    
    // Restore the stubs
    isRepoCleanStub.restore();
    createCheckpointStub.restore();
    analyzeAndDiffStub.restore();
    writeTextFileStub.restore();
    applyChangesStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("SPARC2Agent executeCode should execute code in sandbox", async () => {
  setupTest();
  
  try {
    // Create an agent
    const agent = new SPARC2Agent(testAgentOptions);
    await agent.init();
    
    // Stub executeCode from codeInterpreter
    const executeCodeStub = stub(
      await import("../sandbox/codeInterpreter.ts"),
      "executeCode",
      () => Promise.resolve({
        text: "Hello, world!",
        results: [],
        logs: { stdout: [], stderr: [] }
      })
    );
    
    const result = await agent.executeCode("console.log('Hello, world!')");
    
    // Verify that executeCode was called with the correct arguments
    assertSpyCalls(executeCodeStub, 1);
    assertEquals(executeCodeStub.calls[0].args[0], "console.log('Hello, world!')");
    assertEquals(executeCodeStub.calls[0].args[1]?.stream, true);
    
    // Verify the result
    assertEquals(result.text, "Hello, world!");
    
    // Restore the stub
    executeCodeStub.restore();
  } finally {
    teardownTest();
  }
});
