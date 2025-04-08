# SPARC-Bench Benchmark Results

This directory contains benchmark results from running SPARC-Bench against various benchmark types. The benchmark results are organized by benchmark type in separate subdirectories.

## Directory Structure

- `humaneval/` - Contains results from HumanEval benchmarks
- `swebench/` - Contains results from SWE-bench benchmarks
- `redcode/` - Contains results from RedCode benchmarks

## File Naming Convention

Each benchmark result file follows this naming convention:

```
{benchmark-type}-{benchmark-name}-{timestamp}-{run-id}.json
```

For example:
```
humaneval-sparc2-code-analysis-2025-03-16T14-42-15-123Z-a1b2c3d4.json
```

This naming convention ensures that each result file has a unique identifier and can be easily traced back to a specific benchmark run.

## Result File Format

Each benchmark result file contains a JSON object with the following structure:

```json
{
  "benchmarkType": "humaneval",
  "benchmarkName": "sparc2-code-analysis",
  "totalTests": 10,
  "passedTests": 8,
  "failedTests": 2,
  "skippedTests": 0,
  "metrics": {
    "accuracy": 0.8,
    "efficiency": 0.95,
    "safety": 1.0,
    "adaptability": 0.9
  },
  "testResults": [
    {
      "testId": "test-1",
      "passed": true,
      "executionTime": 1234.56,
      "output": "Test output"
    },
    ...
  ]
}
```

## Summary Reports

For each benchmark run, a summary report is generated in Markdown format with the following naming convention:

```
benchmark-summary-{timestamp}-{run-id}.md
```

This report provides an overview of all benchmarks run in a single session.

## Analysis Reports

For each benchmark run, a detailed analysis report is generated in Markdown format with the following naming convention:

```
README-{timestamp}-{run-id}.md
```

This report provides a detailed analysis of the benchmark results, including:

- Overall metrics
- Individual benchmark results
- Performance analysis
- Safety analysis
- Adaptability analysis
- Benchmark comparison
- Recommendations for improvement

## Combined Results

For each benchmark run, a combined results file is generated with the following naming convention:

```
all-benchmarks-{timestamp}-{run-id}.json
```

This file contains an array of all benchmark results from a single run.

## Running Benchmarks

To run benchmarks, use the `run-sparc2-benchmark.ts` script:

```bash
deno run -A scripts/sparc-bench/run-sparc2-benchmark.ts
```

This will run all benchmarks and generate result files in the appropriate directories.

## Analyzing Results

The benchmark results can be analyzed using the generated analysis reports. These reports provide insights into the performance of SPARC2 across different benchmark types and metrics.

For custom analysis, you can use the individual benchmark result files and the combined results file to generate your own reports.