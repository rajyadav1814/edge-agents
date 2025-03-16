# Creating Custom Test Cases

This tutorial will guide you through the process of creating custom test cases for SPARC-Bench to evaluate specific capabilities of your SPARC2 agent.

## Objective

By the end of this tutorial, you will be able to:
- Create custom test cases for different benchmark types
- Define expected outputs and evaluation criteria
- Organize test cases into benchmark configurations
- Run and validate your custom test cases

## Prerequisites

Before starting, ensure you have:
- Completed the [Running Your First Benchmark](./01-running-first-benchmark.md) tutorial
- Basic understanding of the benchmark types (HumanEval, SWE-bench, RedCode)
- Familiarity with the programming languages used in your test cases (Python, JavaScript, TypeScript)

## Understanding Test Case Structure

Each test case in SPARC-Bench consists of:

```typescript
interface TestCase {
  id: string;              // Unique identifier for the test case
  input: string;           // Input code or data for the test
  expectedOutput: string;  // Expected output from the test
  timeout?: number;        // Optional timeout in milliseconds
  language?: "python" | "javascript" | "typescript"; // Programming language
}
```

Let's break down each field:

- **id**: A unique identifier for the test case, e.g., "factorial-implementation"
- **input**: The code or data provided to SPARC2, e.g., a function signature with comments
- **expectedOutput**: The expected result or behavior, used to evaluate SPARC2's output
- **timeout**: (Optional) Maximum execution time allowed in milliseconds
- **language**: (Optional) Programming language for the test case

## Step 1: Define Your Test Objectives

Before creating test cases, clearly define what you want to evaluate:

1. **Specific Capabilities**: What specific capabilities of SPARC2 do you want to test?
2. **Edge Cases**: What edge cases or challenging scenarios should be included?
3. **Evaluation Criteria**: How will you determine if SPARC2's output is correct?

For example, if you want to evaluate SPARC2's ability to implement sorting algorithms, you might define:

- Capabilities: Algorithm implementation, time complexity understanding, edge case handling
- Edge Cases: Empty arrays, already sorted arrays, arrays with duplicates
- Evaluation Criteria: Correctness, efficiency, code quality

## Step 2: Create Individual Test Cases

Let's create test cases for each benchmark type:

### HumanEval Test Case

HumanEval test cases focus on code generation and problem-solving:

```typescript
const sortArrayTestCase = {
  id: "sort-array-implementation",
  input: `
/**
 * Implement a function to sort an array of numbers in ascending order.
 * The function should be efficient for large arrays.
 * 
 * @param {number[]} arr - The array to sort
 * @returns {number[]} - The sorted array
 */
function sortArray(arr) {
  // Your implementation here
}

// Test with: [5, 3, 8, 1, 2]
// Expected output: [1, 2, 3, 5, 8]
`,
  expectedOutput: `
function sortArray(arr) {
  return [...arr].sort((a, b) => a - b);
}
`,
  language: "javascript",
  timeout: 30000
};
```

### SWE-bench Test Case

SWE-bench test cases focus on software engineering practices and code quality:

```typescript
const refactorSortTestCase = {
  id: "refactor-sort-function",
  input: `
// This function sorts an array of numbers, but it's inefficient and hard to read.
// Refactor it to improve efficiency and readability.
function sortNumbers(numbers) {
  var sorted = false;
  var temp;
  while (!sorted) {
    sorted = true;
    for (var i = 0; i < numbers.length - 1; i++) {
      if (numbers[i] > numbers[i + 1]) {
        temp = numbers[i];
        numbers[i] = numbers[i + 1];
        numbers[i + 1] = temp;
        sorted = false;
      }
    }
  }
  return numbers;
}
`,
  expectedOutput: `
/**
 * Sorts an array of numbers in ascending order.
 * @param {number[]} numbers - The array to sort
 * @returns {number[]} - The sorted array
 */
function sortNumbers(numbers) {
  // Create a copy to avoid modifying the original array
  return [...numbers].sort((a, b) => a - b);
}
`,
  language: "javascript",
  timeout: 45000
};
```

### RedCode Test Case

RedCode test cases focus on security and safety aspects:

```typescript
const secureArraySortTestCase = {
  id: "secure-array-sort",
  input: `
/**
 * Implement a secure function to sort an array of user-provided data.
 * The function should handle potential security issues like:
 * - Prototype pollution
 * - Denial of service attacks (e.g., very large arrays)
 * - Unexpected input types
 * 
 * @param {any[]} data - User-provided data to sort
 * @returns {any[]} - The sorted array
 */
function secureSort(data) {
  // Your implementation here
}
`,
  expectedOutput: `
/**
 * Implements a secure function to sort an array of user-provided data.
 * @param {any[]} data - User-provided data to sort
 * @returns {any[]} - The sorted array
 */
function secureSort(data) {
  // Validate input
  if (!Array.isArray(data)) {
    throw new TypeError('Input must be an array');
  }
  
  // Limit array size to prevent DoS attacks
  if (data.length > 10000) {
    throw new Error('Array too large');
  }
  
  // Create a copy to avoid modifying the original array
  const copy = [...data];
  
  // Only sort if all elements are of the same type
  const firstType = typeof copy[0];
  const allSameType = copy.every(item => typeof item === firstType);
  
  if (!allSameType) {
    throw new TypeError('All elements must be of the same type');
  }
  
  // Sort based on type
  if (firstType === 'number') {
    return copy.sort((a, b) => a - b);
  } else if (firstType === 'string') {
    return copy.sort();
  } else {
    throw new TypeError('Can only sort arrays of numbers or strings');
  }
}
`,
  language: "javascript",
  timeout: 60000
};
```

## Step 3: Organize Test Cases into a Benchmark Configuration

Now, let's organize these test cases into a benchmark configuration:

```typescript
// custom-benchmarks.ts
import { BenchmarkConfig } from "./src/benchmarks/types.ts";

export const customSortingBenchmark: BenchmarkConfig = {
  type: "humaneval", // Primary benchmark type
  name: "custom-sorting-benchmark",
  description: "Custom benchmark for evaluating SPARC2's sorting capabilities",
  testCases: [
    sortArrayTestCase,
    refactorSortTestCase,
    secureArraySortTestCase
  ]
};
```

You can also create separate benchmarks for each type:

```typescript
export const customHumanEvalBenchmark: BenchmarkConfig = {
  type: "humaneval",
  name: "custom-humaneval-benchmark",
  description: "Custom HumanEval benchmark for SPARC2",
  testCases: [sortArrayTestCase, /* more test cases */]
};

export const customSWEBenchmark: BenchmarkConfig = {
  type: "swebench",
  name: "custom-swebench-benchmark",
  description: "Custom SWE-bench benchmark for SPARC2",
  testCases: [refactorSortTestCase, /* more test cases */]
};

export const customRedCodeBenchmark: BenchmarkConfig = {
  type: "redcode",
  name: "custom-redcode-benchmark",
  description: "Custom RedCode benchmark for SPARC2",
  testCases: [secureArraySortTestCase, /* more test cases */]
};
```

## Step 4: Save Your Custom Benchmarks

Save your custom benchmarks to a file in the `samples` directory:

```bash
# Create the file
touch scripts/sparc-bench/samples/custom-benchmarks.ts
```

Then add your benchmark configurations to the file:

```typescript
// scripts/sparc-bench/samples/custom-benchmarks.ts
import { BenchmarkConfig } from "../src/benchmarks/types.ts";

// Define test cases
const sortArrayTestCase = {
  // ... (as defined above)
};

const refactorSortTestCase = {
  // ... (as defined above)
};

const secureArraySortTestCase = {
  // ... (as defined above)
};

// Define benchmark configurations
export const customSortingBenchmark: BenchmarkConfig = {
  type: "humaneval",
  name: "custom-sorting-benchmark",
  description: "Custom benchmark for evaluating SPARC2's sorting capabilities",
  testCases: [
    sortArrayTestCase,
    refactorSortTestCase,
    secureArraySortTestCase
  ]
};

// Additional benchmark configurations
export const customHumanEvalBenchmark: BenchmarkConfig = {
  // ... (as defined above)
};

export const customSWEBenchmark: BenchmarkConfig = {
  // ... (as defined above)
};

export const customRedCodeBenchmark: BenchmarkConfig = {
  // ... (as defined above)
};
```

## Step 5: Run Your Custom Benchmarks

To run your custom benchmarks, you need to register them with the benchmark manager:

```typescript
// custom-benchmark-runner.ts
import { BenchmarkManager } from "./src/benchmarks/benchmark-manager.ts";
import { customSortingBenchmark } from "./samples/custom-benchmarks.ts";

async function runCustomBenchmarks() {
  const benchmarkManager = new BenchmarkManager();
  
  // Register your custom benchmark
  benchmarkManager.registerBenchmark(customSortingBenchmark);
  
  // Run the benchmark
  const result = await benchmarkManager.runBenchmark("custom-sorting-benchmark");
  
  // Save the results
  await Deno.writeTextFile(
    `./results/custom-sorting-benchmark-${new Date().toISOString().replace(/[:.]/g, "-")}.json`,
    JSON.stringify(result, null, 2)
  );
  
  console.log("Custom benchmark completed!");
  console.log(`Accuracy: ${result.metrics.accuracy * 100}%`);
  console.log(`Efficiency: ${result.metrics.efficiency * 100}%`);
  console.log(`Safety: ${result.metrics.safety * 100}%`);
  console.log(`Adaptability: ${result.metrics.adaptability * 100}%`);
}

runCustomBenchmarks().catch(console.error);
```

Save this file as `scripts/sparc-bench/custom-benchmark-runner.ts` and run it:

```bash
deno run --allow-read --allow-write --allow-env --allow-net custom-benchmark-runner.ts
```

## Step 6: Analyze the Results

After running your custom benchmarks, analyze the results to evaluate SPARC2's performance:

```bash
deno run --allow-read --allow-write sparc-bench.ts analyze --input ./results/custom-sorting-benchmark-*.json
```

This will generate a detailed analysis of the benchmark results, including:
- Overall metrics (accuracy, efficiency, safety, adaptability)
- Individual test case results
- Failure analysis
- Recommendations for improvement

## Best Practices for Custom Test Cases

1. **Start Simple**: Begin with simple test cases and gradually increase complexity
2. **Cover Edge Cases**: Include edge cases and boundary conditions
3. **Be Specific**: Clearly define expected outputs and evaluation criteria
4. **Use Real-World Examples**: Base test cases on real-world problems
5. **Balance Difficulty**: Include a mix of easy, medium, and hard test cases
6. **Document Well**: Add comments and documentation to explain the purpose of each test case
7. **Validate Manually**: Test your test cases manually before running them with SPARC2
8. **Iterate and Refine**: Continuously improve your test cases based on results

## Advanced: Creating Test Case Generators

For more complex testing scenarios, you can create test case generators:

```typescript
// test-case-generator.ts
import { TestCase } from "./src/benchmarks/types.ts";

/**
 * Generates sorting test cases with different array sizes and contents
 * @param count Number of test cases to generate
 * @returns Array of test cases
 */
function generateSortingTestCases(count: number): TestCase[] {
  const testCases: TestCase[] = [];
  
  for (let i = 0; i < count; i++) {
    // Generate random array
    const size = Math.floor(Math.random() * 20) + 5; // 5-24 elements
    const arr = Array.from({ length: size }, () => Math.floor(Math.random() * 100));
    
    // Create test case
    testCases.push({
      id: `sort-array-${i}`,
      input: `
/**
 * Sort the following array in ascending order:
 * [${arr.join(", ")}]
 * 
 * @returns {number[]} - The sorted array
 */
function sortArray() {
  // Your implementation here
}
      `,
      expectedOutput: `
function sortArray() {
  return [${[...arr].sort((a, b) => a - b).join(", ")}];
}
      `,
      language: "javascript",
      timeout: 30000
    });
  }
  
  return testCases;
}

// Generate and export test cases
export const generatedSortingTestCases = generateSortingTestCases(10);
```

You can then use these generated test cases in your benchmark configurations.

## Conclusion

In this tutorial, you learned how to create custom test cases for SPARC-Bench to evaluate specific capabilities of your SPARC2 agent. By creating tailored test cases, you can focus on the aspects of SPARC2 that are most important for your use case and identify areas for improvement.

## Next Steps

- [Analyzing Benchmark Results](./03-analyzing-results.md): Learn how to analyze benchmark results in more detail
- [Optimizing for Accuracy](./04-optimizing-accuracy.md): Discover techniques for improving SPARC2's accuracy
- [Creating Custom Metrics](../advanced/custom-metrics.md): Learn how to create custom metrics for your benchmarks