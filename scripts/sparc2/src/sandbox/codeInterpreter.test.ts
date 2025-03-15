import { assertEquals, assertRejects, assertStringIncludes } from "https://deno.land/std@0.203.0/testing/asserts.ts";
import { spy, stub, assertSpyCalls } from "https://deno.land/std@0.203.0/testing/mock.ts";
import {
  createSandbox,
  executeCode,
  executeFile,
  installPackages,
  writeFile,
  readFile,
  listFiles
} from "./codeInterpreter.ts";
import * as logger from "../logger.ts";

// Mock the logger to avoid actual logging during tests
const logMessageSpy = spy(logger, "logMessage");

// Mock for Deno.readTextFile
const originalReadTextFile = Deno.readTextFile;

// Mock for successful sandbox creation
const mockSuccessfulSandbox = () => {
  return {
    notebook: {
      execCell: async (_code: string, _options: any) => ({
        text: "Execution successful",
        results: [{ type: "text", value: "Result value" }],
        logs: { stdout: ["stdout message"], stderr: [] }
      })
    },
    filesystem: {
      write: async (_path: string, _content: string) => {},
      read: async (_path: string) => "File content",
      list: async (_path: string) => ["file1.txt", "file2.txt"]
    },
    close: async () => {}
  };
};

// Mock for sandbox with execution error
const mockErrorSandbox = () => {
  return {
    notebook: {
      execCell: async (_code: string, _options: any) => {
        throw new Error("Execution failed");
      }
    },
    filesystem: {
      write: async (_path: string, _content: string) => {
        throw new Error("Write failed");
      },
      read: async (_path: string) => {
        throw new Error("Read failed");
      },
      list: async (_path: string) => {
        throw new Error("List failed");
      }
    },
    close: async () => {}
  };
};

// Setup and teardown for each test
function setupTest() {
  // Reset all spies
  logMessageSpy.calls = [];
  
  // Set environment variable for testing
  Deno.env.set("E2B_API_KEY", "test-api-key");
}

function teardownTest() {
  // Restore original functions if they were stubbed
  Deno.env.delete("E2B_API_KEY");
}

Deno.test("createSandbox should create a sandbox instance", async () => {
  setupTest();
  
  try {
    // Stub the import to return our mock
    const importStub = stub(
      globalThis,
      "import",
      () => Promise.resolve({ CodeInterpreter: { create: () => Promise.resolve(mockSuccessfulSandbox()) } })
    );
    
    // Call the function
    const sandbox = await createSandbox();
    
    // Verify the result
    assertEquals(typeof sandbox.notebook.execCell, "function");
    assertEquals(typeof sandbox.filesystem.write, "function");
    assertEquals(typeof sandbox.filesystem.read, "function");
    assertEquals(typeof sandbox.filesystem.list, "function");
    assertEquals(typeof sandbox.close, "function");
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    importStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("createSandbox should throw if API key is missing", async () => {
  setupTest();
  
  try {
    // Remove the API key
    Deno.env.delete("E2B_API_KEY");
    
    // Verify that it throws
    await assertRejects(
      async () => {
        await createSandbox();
      },
      Error,
      "E2B_API_KEY is required"
    );
  } finally {
    teardownTest();
  }
});

Deno.test("executeCode should execute code and return result", async () => {
  setupTest();
  
  try {
    // Stub createSandbox to return our mock
    const createSandboxStub = stub(
      { createSandbox },
      "createSandbox",
      () => Promise.resolve(mockSuccessfulSandbox())
    );
    
    // Call the function
    const result = await executeCode("console.log('test')");
    
    // Verify the result
    assertEquals(result.text, "Execution successful");
    assertEquals(result.results.length, 1);
    assertEquals(result.results[0].type, "text");
    assertEquals(result.results[0].value, "Result value");
    assertEquals(result.logs.stdout.length, 1);
    assertEquals(result.logs.stdout[0], "stdout message");
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    createSandboxStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("executeCode should handle execution error", async () => {
  setupTest();
  
  try {
    // Stub createSandbox to return our error mock
    const createSandboxStub = stub(
      { createSandbox },
      "createSandbox",
      () => Promise.resolve(mockErrorSandbox())
    );
    
    // Verify that it throws
    await assertRejects(
      async () => {
        await executeCode("console.log('test')");
      },
      Error,
      "Execution failed"
    );
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    createSandboxStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("executeFile should read file and execute its content", async () => {
  setupTest();
  
  try {
    // Stub Deno.readTextFile
    const readTextFileStub = stub(
      Deno,
      "readTextFile",
      () => Promise.resolve("console.log('test')")
    );
    
    // Stub executeCode
    const executeCodeStub = stub(
      { executeCode },
      "executeCode",
      () => Promise.resolve({
        text: "File execution successful",
        results: [],
        logs: { stdout: [], stderr: [] }
      })
    );
    
    // Call the function
    const result = await executeFile("test.js");
    
    // Verify the result
    assertEquals(result.text, "File execution successful");
    
    // Verify that executeCode was called with the file content
    assertEquals(executeCodeStub.calls.length, 1);
    assertEquals(executeCodeStub.calls[0].args[0], "console.log('test')");
    
    // Restore the stubs
    readTextFileStub.restore();
    executeCodeStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("executeFile should detect language from file extension", async () => {
  setupTest();
  
  try {
    // Stub Deno.readTextFile
    const readTextFileStub = stub(
      Deno,
      "readTextFile",
      () => Promise.resolve("print('test')")
    );
    
    // Stub executeCode
    const executeCodeStub = stub(
      { executeCode },
      "executeCode",
      (_code: string, options: any) => {
        assertEquals(options.language, "python");
        return Promise.resolve({
          text: "Python execution successful",
          results: [],
          logs: { stdout: [], stderr: [] }
        });
      }
    );
    
    // Call the function with a Python file
    await executeFile("test.py");
    
    // Verify that executeCode was called with the correct language
    assertEquals(executeCodeStub.calls.length, 1);
    
    // Restore the stubs
    readTextFileStub.restore();
    executeCodeStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("installPackages should install packages in the sandbox", async () => {
  setupTest();
  
  try {
    // Stub createSandbox to return our mock
    const createSandboxStub = stub(
      { createSandbox },
      "createSandbox",
      () => Promise.resolve(mockSuccessfulSandbox())
    );
    
    // Call the function
    const result = await installPackages(["numpy", "pandas"]);
    
    // Verify the result
    assertEquals(result.text, "Execution successful");
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    createSandboxStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("writeFile should write content to a file in the sandbox", async () => {
  setupTest();
  
  try {
    // Stub createSandbox to return our mock
    const createSandboxStub = stub(
      { createSandbox },
      "createSandbox",
      () => Promise.resolve(mockSuccessfulSandbox())
    );
    
    // Call the function
    await writeFile("/path/to/file.txt", "File content");
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    createSandboxStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("readFile should read content from a file in the sandbox", async () => {
  setupTest();
  
  try {
    // Stub createSandbox to return our mock
    const createSandboxStub = stub(
      { createSandbox },
      "createSandbox",
      () => Promise.resolve(mockSuccessfulSandbox())
    );
    
    // Call the function
    const content = await readFile("/path/to/file.txt");
    
    // Verify the result
    assertEquals(content, "File content");
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    createSandboxStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("listFiles should list files in the sandbox", async () => {
  setupTest();
  
  try {
    // Stub createSandbox to return our mock
    const createSandboxStub = stub(
      { createSandbox },
      "createSandbox",
      () => Promise.resolve(mockSuccessfulSandbox())
    );
    
    // Call the function
    const files = await listFiles("/path/to/dir");
    
    // Verify the result
    assertEquals(files, ["file1.txt", "file2.txt"]);
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    createSandboxStub.restore();
  } finally {
    teardownTest();
  }
});

// Test error handling for file operations
Deno.test("writeFile should handle errors", async () => {
  setupTest();
  
  try {
    // Stub createSandbox to return our error mock
    const createSandboxStub = stub(
      { createSandbox },
      "createSandbox",
      () => Promise.resolve(mockErrorSandbox())
    );
    
    // Verify that it throws
    await assertRejects(
      async () => {
        await writeFile("/path/to/file.txt", "File content");
      },
      Error,
      "Write failed"
    );
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    createSandboxStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("readFile should handle errors", async () => {
  setupTest();
  
  try {
    // Stub createSandbox to return our error mock
    const createSandboxStub = stub(
      { createSandbox },
      "createSandbox",
      () => Promise.resolve(mockErrorSandbox())
    );
    
    // Verify that it throws
    await assertRejects(
      async () => {
        await readFile("/path/to/file.txt");
      },
      Error,
      "Read failed"
    );
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    createSandboxStub.restore();
  } finally {
    teardownTest();
  }
});

Deno.test("listFiles should handle errors", async () => {
  setupTest();
  
  try {
    // Stub createSandbox to return our error mock
    const createSandboxStub = stub(
      { createSandbox },
      "createSandbox",
      () => Promise.resolve(mockErrorSandbox())
    );
    
    // Verify that it throws
    await assertRejects(
      async () => {
        await listFiles("/path/to/dir");
      },
      Error,
      "List failed"
    );
    
    // Verify that the logger was called
    assertSpyCalls(logMessageSpy, 1);
    
    // Restore the stub
    createSandboxStub.restore();
  } finally {
    teardownTest();
  }
});