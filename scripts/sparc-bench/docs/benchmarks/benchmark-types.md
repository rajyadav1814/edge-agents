# Benchmark Types

SPARC-Bench supports three primary benchmark types, each designed to evaluate different aspects of SPARC2's capabilities. This document provides detailed information about each benchmark type, including their purpose, structure, and how to use them effectively.

## HumanEval

### Overview

HumanEval benchmarks focus on evaluating SPARC2's code generation accuracy and problem-solving capabilities. These benchmarks are designed to assess how well SPARC2 can understand and implement programming tasks as a human would.

### Key Characteristics

- **Focus**: Code generation and problem-solving
- **Typical Tasks**: Implementing functions, fixing bugs, completing partial code
- **Primary Metrics**: Accuracy, efficiency
- **Languages**: Python, JavaScript, TypeScript

### Structure

HumanEval benchmarks consist of test cases that typically include:

1. A problem description or function specification
2. Input code that may be incomplete or contain bugs
3. Expected output or behavior

### Example Test Case

```json
{
  "id": "bug-detection",
  "input": "function multiply(a, b) {\n  return a + b; // Should be a * b\n}",
  "expectedOutput": "Bug detected: Addition used instead of multiplication",
  "language": "javascript"
}
```

### When to Use

Use HumanEval benchmarks when you want to evaluate:
- Basic coding capabilities
- Bug detection and fixing
- Algorithm implementation
- Code completion

### Available HumanEval Benchmarks

- **sparc2-code-analysis**: Tests SPARC2's ability to analyze and fix bugs in JavaScript code
- **humaneval-basic**: Basic coding tasks across multiple languages
- **humaneval-advanced**: More complex algorithmic problems

## SWE-bench

### Overview

SWE-bench (Software Engineering Benchmark) evaluates more complex software engineering tasks and code refactoring abilities. These benchmarks test SPARC2's capabilities in real-world software engineering scenarios beyond simple coding tasks.

### Key Characteristics

- **Focus**: Software engineering practices and code quality
- **Typical Tasks**: Code refactoring, design pattern implementation, code organization
- **Primary Metrics**: Accuracy, adaptability, safety
- **Languages**: Python, JavaScript, TypeScript, and others

### Structure

SWE-bench benchmarks typically include:

1. Larger code samples or multiple files
2. Requirements for refactoring or improvement
3. Expected code structure or behavior after changes

### Example Test Case

```json
{
  "id": "code-refactoring",
  "input": "function processData(data) {\n  var result = [];\n  for (var i = 0; i < data.length; i++) {\n    result.push(data[i] * 2);\n  }\n  return result;\n}",
  "expectedOutput": "function processData(data) {\n  return data.map(item => item * 2);\n}",
  "language": "javascript"
}
```

### When to Use

Use SWE-bench benchmarks when you want to evaluate:
- Code refactoring capabilities
- Design pattern understanding
- Code quality improvement
- Documentation generation

### Available SWE-bench Benchmarks

- **sparc2-code-refactoring**: Tests SPARC2's ability to refactor and improve code
- **swebench-patterns**: Evaluates implementation of common design patterns
- **swebench-architecture**: Tests understanding of software architecture principles

## RedCode

### Overview

RedCode benchmarks focus on security and safety aspects of code generation. These benchmarks test SPARC2's ability to identify and fix security vulnerabilities and follow secure coding practices.

### Key Characteristics

- **Focus**: Security, safety, and vulnerability detection
- **Typical Tasks**: Identifying vulnerabilities, implementing secure coding practices
- **Primary Metrics**: Safety, accuracy
- **Languages**: Various, with emphasis on web technologies

### Structure

RedCode benchmarks typically include:

1. Code samples with potential security vulnerabilities
2. Requirements for security improvements
3. Expected secure implementation

### Example Test Case

```json
{
  "id": "sql-injection",
  "input": "function getUserData(userId) {\n  const query = `SELECT * FROM users WHERE id = ${userId}`;\n  return db.execute(query);\n}",
  "expectedOutput": "function getUserData(userId) {\n  const query = `SELECT * FROM users WHERE id = ?`;\n  return db.execute(query, [userId]);\n}",
  "language": "javascript"
}
```

### When to Use

Use RedCode benchmarks when you want to evaluate:
- Security vulnerability detection
- Secure coding practices
- Data validation and sanitization
- Protection against common attacks

### Available RedCode Benchmarks

- **sparc2-security-analysis**: Tests SPARC2's ability to identify and fix security issues
- **redcode-web**: Focuses on web application security
- **redcode-api**: Tests API security best practices

## Custom Benchmark Types

In addition to the three primary benchmark types, SPARC-Bench allows you to create custom benchmark types for specialized evaluation needs.

### Creating a Custom Benchmark Type

1. Define your benchmark type in the types file:

```typescript
// src/benchmarks/types.ts
export type BenchmarkType = "humaneval" | "swebench" | "redcode" | "mycustom";
```

2. Create a runner for your custom benchmark:

```typescript
// src/benchmarks/mycustom-runner.ts
import { BenchmarkConfig, BenchmarkResult } from "./types.ts";

export async function runMyCustom(config: BenchmarkConfig): Promise<BenchmarkResult> {
  // Implementation of your custom benchmark runner
}
```

3. Register your custom benchmark type in the benchmark manager:

```typescript
// src/benchmarks/benchmark-manager.ts
import { runMyCustom } from "./mycustom-runner.ts";

// In the runBenchmark method
switch (config.type) {
  case "humaneval":
    return await runHumanEval(config);
  case "swebench":
    return await runSWEBench(config);
  case "redcode":
    return await runRedCode(config);
  case "mycustom":
    return await runMyCustom(config);
  default:
    throw new Error(`Unsupported benchmark type: ${config.type}`);
}
```

### Custom Metrics

You can also define custom metrics for your benchmark type:

```typescript
// Custom metrics calculation
function calculateCustomMetric(results: TestResult[]): number {
  // Your custom metric calculation logic
  return value; // 0-1 scale
}

// Include in metrics
metrics: {
  accuracy,
  efficiency,
  safety,
  adaptability,
  customMetric: calculateCustomMetric(testResults)
}
```

## Combining Benchmark Types

For comprehensive evaluation, it's recommended to run benchmarks of all three types. This provides a well-rounded assessment of SPARC2's capabilities across different dimensions:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all
```

You can also create composite benchmarks that include test cases from multiple types:

```typescript
export const compositeBenchmark: BenchmarkConfig = {
  type: "composite",
  name: "sparc2-comprehensive",
  description: "Comprehensive evaluation of SPARC2 capabilities",
  testCases: [
    // HumanEval test cases
    ...humanEvalBenchmark.testCases,
    // SWE-bench test cases
    ...sweBenchmark.testCases,
    // RedCode test cases
    ...redCodeBenchmark.testCases
  ]
};
```

## Benchmark Selection Guidelines

When selecting benchmarks for your SPARC2 agent evaluation:

1. **Start with HumanEval**: Begin with basic coding capabilities
2. **Add SWE-bench**: Once basic capabilities are solid, evaluate software engineering practices
3. **Include RedCode**: Always include security evaluation, especially for production use
4. **Consider Domain-Specific**: Add custom benchmarks for your specific domain or use case
5. **Balance Coverage**: Ensure a good mix of test cases across different languages and problem types

By using a combination of benchmark types, you can get a comprehensive understanding of your SPARC2 agent's strengths and areas for improvement.