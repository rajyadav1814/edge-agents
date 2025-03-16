# Quick Start Guide

This guide will help you get up and running with SPARC-Bench quickly to start benchmarking your SPARC2 agents.

## Prerequisites

- [Deno](https://deno.land/) 1.37.0 or higher
- [E2B](https://e2b.dev/) API key for secure code execution
- SPARC2 installation

## Installation

1. Clone the repository (if you haven't already):

```bash
git clone https://github.com/your-org/edge-agents.git
cd edge-agents
```

2. Set up your environment variables:

Create a `.env` file in the `scripts/sparc2` directory with the following content:

```
E2B_API_KEY=your_e2b_api_key_here
```

## Running Your First Benchmark

To run a basic benchmark against your SPARC2 agent:

```bash
cd scripts/sparc-bench
deno run --allow-read --allow-write --allow-env --allow-net run-sparc2-benchmark.ts
```

This will run all three benchmark types (HumanEval, SWE-bench, and RedCode) and generate a comprehensive report in the `results` directory.

## Using the CLI

SPARC-Bench provides a powerful CLI for more control over your benchmarking:

```bash
# Run a specific benchmark
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark sparc2-code-analysis

# Run all benchmarks of a specific type
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --type humaneval

# Run benchmarks in parallel with verbose output
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all --parallel --verbose
```

## Viewing Results

After running benchmarks, you can find the results in the `results` directory:

- JSON files containing raw benchmark data
- Markdown files with formatted reports and analysis
- Summary files with aggregated metrics

## Next Steps

- Read the [Installation Guide](./installation.md) for more detailed setup instructions
- Explore [Configuration Options](../configuration/config-options.md) to customize your benchmarks
- Check out the [Tutorials](../tutorials/README.md) for step-by-step guides on common tasks
- Learn about [Advanced Features](../advanced/README.md) for optimizing your benchmarks