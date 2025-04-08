# Running Your First Benchmark

This tutorial will guide you through the process of running your first benchmark with SPARC-Bench to evaluate your SPARC2 agent's performance.

## Objective

By the end of this tutorial, you will be able to:
- Run a basic benchmark against your SPARC2 agent
- Understand the benchmark results
- Generate a comprehensive report

## Prerequisites

Before starting, ensure you have:
- SPARC-Bench installed (see [Installation Guide](../getting-started/installation.md))
- E2B API key configured in your environment
- Basic understanding of SPARC2 and benchmarking concepts

## Step 1: Choose a Benchmark

SPARC-Bench comes with several pre-configured benchmarks. For your first run, we'll use the `sparc2-code-analysis` benchmark, which is part of the HumanEval benchmark type.

To see all available benchmarks, run:

```bash
cd scripts/sparc-bench
deno run --allow-read sparc-bench.ts list
```

You should see output similar to:

```
Available Benchmarks:
- sparc2-code-analysis (humaneval): Tests SPARC2's ability to analyze and fix bugs in JavaScript code
- sparc2-code-refactoring (swebench): Tests SPARC2's ability to refactor and improve code
- sparc2-security-analysis (redcode): Tests SPARC2's ability to identify and fix security issues
```

## Step 2: Run the Benchmark

Now, let's run the `sparc2-code-analysis` benchmark:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark sparc2-code-analysis
```

This command will:
1. Load the benchmark configuration
2. Execute each test case in the benchmark
3. Collect and analyze the results
4. Generate a report

You'll see output showing the progress of each test case:

```
Running benchmark: sparc2-code-analysis (humaneval)
Running test case: bug-detection
Test passed: bug-detection (1250.45ms)
Running test case: bug-fixing
Test passed: bug-fixing (1876.32ms)
...
```

## Step 3: Understand the Results

After the benchmark completes, you'll see a summary of the results:

```
Benchmark Results:
- Benchmark: sparc2-code-analysis (humaneval)
- Total Tests: 10
- Passed: 8 (80%)
- Failed: 2 (20%)
- Skipped: 0 (0%)

Metrics:
- Accuracy: 80.00%
- Efficiency: 92.00%
- Safety: 95.00%
- Adaptability: 85.00%
```

Let's understand what these metrics mean:

- **Accuracy**: How correctly your SPARC2 agent completed the tasks (80% in this example)
- **Efficiency**: How quickly and resource-efficiently the tasks were completed (92%)
- **Safety**: How well security best practices were followed (95%)
- **Adaptability**: How well your agent performed across different problem types (85%)

The results are also saved to a JSON file in the `results` directory.

## Step 4: Generate a Detailed Report

For a more comprehensive analysis, you can generate a detailed report:

```bash
deno run --allow-read --allow-write sparc-bench.ts analyze --input results/humaneval-sparc2-code-analysis-*.json
```

This will create a Markdown report with:
- Detailed metrics analysis
- Individual test case results
- Failure analysis
- Recommendations for improvement

The report will be saved to the `results` directory with a filename like `analysis-sparc2-code-analysis-TIMESTAMP.md`.

## Step 5: Visualize the Results

To visualize your benchmark results, you can use the `visualize` command:

```bash
deno run --allow-read --allow-write sparc-bench.ts visualize --input results/humaneval-sparc2-code-analysis-*.json
```

This will generate charts and graphs in the `results/charts` directory, including:
- Accuracy chart
- Metrics radar chart
- Test duration chart

## Step 6: Run All Benchmark Types

To get a comprehensive evaluation of your SPARC2 agent, you can run all benchmark types:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all
```

This will run all available benchmarks and generate a combined report.

Alternatively, you can run all benchmarks of a specific type:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --type humaneval
```

## Step 7: Run Benchmarks in Parallel

For faster execution, you can run benchmarks in parallel:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all --parallel --max-concurrent 2
```

This will run up to 2 benchmarks concurrently, significantly reducing the total execution time.

## Troubleshooting

### Common Issues

1. **Permission Errors**:
   - Ensure you include all necessary Deno permissions (`--allow-read`, `--allow-write`, `--allow-env`, `--allow-net`)

2. **E2B Connection Issues**:
   - Verify your E2B API key is correctly set in the environment
   - Check your internet connection

3. **Timeout Errors**:
   - Increase the timeout with the `--timeout` option:
     ```bash
     deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark sparc2-code-analysis --timeout 60000
     ```

## Next Steps

Now that you've run your first benchmark, you can:
- [Create custom test cases](./02-creating-custom-test-cases.md) to evaluate specific capabilities
- [Analyze benchmark results](./03-analyzing-results.md) in more detail
- [Optimize your SPARC2 agent](./04-optimizing-accuracy.md) based on the benchmark results

## Summary

In this tutorial, you learned how to:
- Run a basic benchmark against your SPARC2 agent
- Understand the benchmark results and metrics
- Generate detailed reports and visualizations
- Run multiple benchmarks and optimize execution

By regularly benchmarking your SPARC2 agent, you can track its performance over time and identify areas for improvement.