# Core Concepts

This document explains the fundamental concepts and components of the SPARC-Bench framework.

## Benchmark Types

SPARC-Bench supports three primary benchmark types, each designed to evaluate different aspects of SPARC2's capabilities:

### HumanEval

HumanEval benchmarks focus on code generation accuracy and problem-solving capabilities. These benchmarks typically involve:

- Implementing functions with specific requirements
- Fixing bugs in existing code
- Completing partially written code
- Solving algorithmic problems

HumanEval benchmarks are particularly useful for evaluating SPARC2's ability to understand and implement programming tasks as a human would.

### SWE-bench

SWE-bench (Software Engineering Benchmark) evaluates more complex software engineering tasks and code refactoring abilities. These benchmarks test:

- Code refactoring and improvement
- Design pattern implementation
- Code organization and structure
- Documentation generation

SWE-bench is designed to assess SPARC2's capabilities in real-world software engineering scenarios beyond simple coding tasks.

### RedCode

RedCode benchmarks focus on security and safety aspects of code generation. These benchmarks test:

- Identifying and fixing security vulnerabilities
- Implementing secure coding practices
- Avoiding common security pitfalls
- Handling sensitive data appropriately

RedCode is crucial for ensuring that SPARC2 generates code that is not only functional but also secure and safe.

## Test Cases

Test cases are the individual tests within each benchmark. Each test case consists of:

- **ID**: A unique identifier for the test case
- **Input**: The code or data provided to SPARC2
- **Expected Output**: The expected result or behavior
- **Language**: The programming language for the test (Python, JavaScript, TypeScript)
- **Timeout**: Maximum execution time allowed (optional)

Test cases are designed to be deterministic, with clear inputs and expected outputs to ensure consistent evaluation.

## Metrics

SPARC-Bench evaluates performance using four key metrics:

### Accuracy

Accuracy measures how correctly SPARC2 completes the given tasks. It is calculated as the ratio of passed tests to total tests:

```
accuracy = passedTests / totalTests
```

Higher accuracy indicates better performance in solving the given problems correctly.

### Efficiency

Efficiency evaluates how quickly and resource-efficiently SPARC2 completes tasks. It is normalized on a 0-1 scale, with higher values indicating better efficiency:

```
efficiency = 1 - (avgExecutionTime / maxAllowedTime)
```

This metric helps identify performance bottlenecks and optimization opportunities.

### Safety

Safety assesses how well SPARC2 adheres to security best practices and avoids vulnerabilities. It is calculated based on the absence of security issues in the generated code:

```
safety = 1 - (safetyIssues / totalTests)
```

A higher safety score indicates more secure code generation.

### Adaptability

Adaptability measures how well SPARC2 performs across different problem types, programming languages, and domains:

```
adaptability = (varianceAcrossCategories) / (expectedVariance)
```

Higher adaptability indicates a more versatile agent capable of handling diverse challenges.

## Benchmark Manager

The Benchmark Manager is the central component that coordinates benchmark execution. It provides:

- Registration of benchmarks
- Execution of individual or multiple benchmarks
- Collection and aggregation of results
- Generation of reports and visualizations

The Benchmark Manager can be configured to run benchmarks sequentially or in parallel, with various options for output and logging.

## E2B Integration

SPARC-Bench integrates with E2B (Environment to Benchmark) to provide a secure sandbox environment for code execution. This integration:

- Ensures safe execution of potentially untrusted code
- Provides consistent execution environments across different machines
- Supports multiple programming languages
- Manages dependencies and package installation

E2B integration is crucial for reliable and secure benchmark execution, especially when evaluating code generation capabilities.

## Results and Analysis

After running benchmarks, SPARC-Bench generates comprehensive results that include:

- Overall metrics (accuracy, efficiency, safety, adaptability)
- Individual test results
- Execution times and resource usage
- Detailed error messages for failed tests
- Comparative analysis across different runs

These results are stored in JSON format for programmatic access and also presented in human-readable Markdown reports for easy interpretation.