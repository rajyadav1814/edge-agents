/**
 * HumanEval Test Script for SPARC 2.0
 * Tests the HumanEval tasks using the SPARC2 agent
 */

import { SPARC2Agent, FileToProcess } from "../src/agent/agent.ts";
import { executeCode } from "../src/sandbox/codeInterpreter.ts";

console.log("Starting HumanEval tests...");

// Interface for HumanEval task
interface HumanEvalTask {
  task_id: string;
  prompt: string;
  entry_point: string;
  canonical_solution: string;
  test: string;
}

/**
 * Run a single HumanEval task
 * @param task The HumanEval task to run
 * @returns Promise that resolves when the task is complete
 */
async function runHumanEvalTask(task: HumanEvalTask): Promise<boolean> {
  console.log(`\n=== Testing ${task.task_id} ===`);
  console.log(`Task: ${task.entry_point}`);
  console.log("Step 1: Creating Python file with prompt");
  
  // Create a temporary file with just the prompt (no solution)
  const tempFilePath = `${task.task_id.replace("/", "_")}.py`;
  const promptContent = task.prompt;
  
  try {
    // Write the prompt file
    await Deno.writeTextFile(tempFilePath, promptContent);
    console.log(`Created Python prompt file: ${tempFilePath}`);
    console.log(`Prompt contents (first 150 chars): ${promptContent.substring(0, 150)}...`);
    
    console.log("\nStep 2: Creating test file for validation");
    
    // Create a test file
    const testFilePath = `test_${task.task_id.replace("/", "_")}.py`;
    const testContent = `
import ${task.task_id.replace("/", "_")} as solution
${task.test}

# Run the tests
if __name__ == "__main__":
    print("Running tests for ${task.task_id}...")
    check(solution.${task.entry_point})
    print("All tests passed for ${task.task_id}")
`;
    
    await Deno.writeTextFile(testFilePath, testContent);
    console.log(`Created test file: ${testFilePath}`);
    console.log(`Test file contents (first 150 chars): ${testContent.substring(0, 150)}...`);
    
    console.log("\nStep 3: Initializing SPARC2 Agent");
    
    // Initialize the SPARC2 agent
    const agent = new SPARC2Agent({
      model: "gpt-4o", // Use a powerful model for code generation
      mode: "automatic",
      diffMode: "function",
      processing: "sequential"
    });
    await agent.init();
    
    // Prepare the file for the agent
    const files: FileToProcess[] = [
      {
        path: tempFilePath,
        originalContent: promptContent
      }
    ];
    
    // Create a suggestion based on the task
    const suggestion = `Implement the ${task.entry_point} function according to the docstring. The function should pass all test cases.`;
    
    console.log("\nStep 4: Running SPARC2 Agent to implement the solution");
    
    // Run the agent to implement the solution
    const results = await agent.planAndExecute(suggestion, files);
    
    // Read the modified file
    const modifiedContent = await Deno.readTextFile(tempFilePath);
    console.log(`\nModified file contents (first 150 chars): ${modifiedContent.substring(0, 150)}...`);
    
    console.log("\nStep 5: Validating solution with tests");
    
    // Execute the code in the sandbox
    const result = await executeCode(`
import sys
sys.path.append('.')
${modifiedContent}
${task.test}

# Run the tests
try:
    check(${task.entry_point})
    print("All tests passed for ${task.task_id}")
    exit(0)
except Exception as e:
    print(f"Test failed: {e}")
    exit(1)
`, { 
      language: "python",
      timeout: 60000
    });
    
    if (result.error) {
      console.error(`Test failed for ${task.task_id}:`);
      console.error(result.error.value);
      console.log(`Test status: FAILED ❌`);
      return false;
    } else {
      console.log(result.text);
      for (const line of result.logs.stdout) {
        console.log(line);
      }
      console.log(`Test status: PASSED ✅`);
      return true;
    }
  } catch (error) {
    console.error(`Error running task ${task.task_id}:`, error);
    console.log(`Test status: ERROR ⚠️`);
    return false;
  } finally {
    console.log("\nStep 6: Cleaning up test files");
    // Clean up
    try {
      await Deno.remove(tempFilePath);
      await Deno.remove(`test_${task.task_id.replace("/", "_")}.py`);
      console.log(`Removed test files: ${tempFilePath}, test_${task.task_id.replace("/", "_")}.py`);
    } catch (error) {
      console.error(`Failed to remove test files: ${error}`);
    }
  }
}

/**
 * Parse HumanEval tasks from JSON strings
 * @param jsonStrings Array of JSON strings representing HumanEval tasks
 * @returns Array of parsed HumanEval tasks
 */
function parseHumanEvalTasks(jsonStrings: string[]): HumanEvalTask[] {
  return jsonStrings.map(jsonString => {
    try {
      console.log("Parsing HumanEval task JSON...");
      return JSON.parse(jsonString) as HumanEvalTask;
    } catch (error) {
      console.error("Failed to parse JSON:", error);
      throw error;
    }
  });
}

/**
 * Run all HumanEval tasks in parallel
 * @param tasks Array of HumanEval tasks
 */
async function runAllTasks(tasks: HumanEvalTask[]): Promise<void> {
  let passed = 0;
  let failed = 0;

  try {
    console.log(`\nPreparing to run ${tasks.length} HumanEval tasks sequentially...`);
    // Run tasks sequentially to avoid resource contention
    for (const task of tasks) {
      const success = await runHumanEvalTask(task);
      success ? passed++ : failed++;
    }
    console.log("\n=== SUMMARY ===");
    console.log(`Total tasks: ${tasks.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log("=== END OF TESTS ===");
  } catch (error) {
    console.error("Failed to run HumanEval tasks:", error);
  }
}

// Main execution
if (import.meta.main) {
  // Get HumanEval tasks from command line arguments or use default
  console.log("Initializing HumanEval test runner with predefined tasks...");
  
  // Define tasks directly as objects to avoid JSON parsing issues
  const tasks: HumanEvalTask[] = [
    {
      task_id: "HumanEval/0",
      prompt: `from typing import List


def has_close_elements(numbers: List[float], threshold: float) -> bool:
    """ Check if in given list of numbers, are any two numbers closer to each other than
    given threshold.
    >>> has_close_elements([1.0, 2.0, 3.0], 0.5)
    False
    >>> has_close_elements([1.0, 2.8, 3.0, 4.0, 5.0, 2.0], 0.3)
    True
    """
`,
      entry_point: "has_close_elements",
      canonical_solution: `    for idx, elem in enumerate(numbers):
        for idx2, elem2 in enumerate(numbers):
            if idx != idx2:
                distance = abs(elem - elem2)
                if distance < threshold:
                    return True

    return False
`,
      test: `

METADATA = {
    'author': 'jt',
    'dataset': 'test'
}


def check(candidate):
    assert candidate([1.0, 2.0, 3.9, 4.0, 5.0, 2.2], 0.3) == True
    assert candidate([1.0, 2.0, 3.9, 4.0, 5.0, 2.2], 0.05) == False
    assert candidate([1.0, 2.0, 5.9, 4.0, 5.0], 0.95) == True
    assert candidate([1.0, 2.0, 5.9, 4.0, 5.0], 0.8) == False
    assert candidate([1.0, 2.0, 3.0, 4.0, 5.0, 2.0], 0.1) == True
    assert candidate([1.1, 2.2, 3.1, 4.1, 5.1], 1.0) == True
    assert candidate([1.1, 2.2, 3.1, 4.1, 5.1], 0.5) == False
`
    },
    {
      task_id: "HumanEval/1",
      prompt: `from typing import List


def separate_paren_groups(paren_string: str) -> List[str]:
    """ Input to this function is a string containing multiple groups of nested parentheses. Your goal is to
    separate those group into separate strings and return the list of those.
    Separate groups are balanced (each open brace is properly closed) and not nested within each other
    Ignore any spaces in the input string.
    >>> separate_paren_groups('( ) (( )) (( )( ))')
    ['()', '(())', '(()())']
    """
`,
      entry_point: "separate_paren_groups",
      canonical_solution: `    result = []
    current_string = []
    current_depth = 0

    for c in paren_string:
        if c == '(':
            current_depth += 1
            current_string.append(c)
        elif c == ')':
            current_depth -= 1
            current_string.append(c)

            if current_depth == 0:
                result.append(''.join(current_string))
                current_string.clear()

    return result
`,
      test: `

METADATA = {
    'author': 'jt',
    'dataset': 'test'
}


def check(candidate):
    assert candidate('(()()) ((())) () ((())()())') == [
        '(()())', '((()))', '()', '((())()())'
    ]
    assert candidate('() (()) ((())) (((())))') == [
        '()', '(())', '((()))', '(((())))'
    ]
    assert candidate('(()(())((())))') == [
        '(()(())((())))'
    ]
    assert candidate('( ) (( )) (( )( ))') == ['()', '(())', '(()())']
`
    }
  ];
  
  // Run tasks
  await runAllTasks(tasks);
}