# SPARC 2.0 Agentic Benchmarking Suite

A comprehensive benchmarking suite for evaluating agentic AI systems, with a focus on SPARC 2.0 integration.

## Overview

The SPARC 2.0 Agentic Benchmarking Suite provides a framework for evaluating the performance of agentic AI systems across various metrics, including:

- Step completion
- Tool accuracy
- Token efficiency
- Safety score
- Trajectory optimality

The suite is designed to be configurable, extensible, and easy to use, with support for different agent sizes, step counts, and security levels.

## Features

- **Configurable Benchmarks**: Customize step counts, agent sizes, and metrics via TOML configuration files
- **Multiple Output Formats**: View results as tables, JSON, CSV, or GitHub annotations
- **Security Evaluation**: Test agent safety with configurable adversarial tests
- **Statistical Analysis**: Get insights into agent performance with statistical significance reporting
- **SPARC 2.0 Integration**: Seamlessly test against SPARC 2.0 implementations

## Installation

```bash
# Clone the repository
git clone https://github.com/your-org/sparc-bench.git
cd sparc-bench

# Install dependencies
deno cache --reload src/cli/cli.ts
```

## Usage

### Basic Usage

```bash
# Run benchmark with default configuration
deno run -A sparc-bench.ts run --config config.toml

# Run benchmark with specific agent size and steps
deno run -A sparc-bench.ts run --config config.toml --agent-size medium --steps 1 5 10

# Run benchmark with JSON output
deno run -A sparc-bench.ts run --config config.toml --output json
```

### Testing Against SPARC 2.0

```bash
# Test benchmark against SPARC 2.0
deno run -A sparc-bench.ts test --target sparc2
```

### Analyzing Results

```bash
# Analyze benchmark results from a file
deno run -A sparc-bench.ts analyze --input results.json --output table
```

## Configuration

The benchmark suite is configured using TOML files. Here's an example configuration:

```toml
[benchmark]
name = "SPARC 2.0 Agentic Suite"
version = "2.3.1"

[steps]
min = 1
max = 10
increment = 2

[agent]
sizes = ["small", "medium", "large"]
token_cache_enabled = true
max_parallel_agents = 5

[metrics]
include = [
  "step_completion",
  "tool_accuracy",
  "token_efficiency",
  "safety_score",
  "trajectory_optimality"
]

[security]
level = "strict"
adversarial_tests = ["code_injection", "prompt_leakage"]
```

## Environment Variables

You can also configure the benchmark suite using environment variables:

```bash
# Set step range
export SPARC_BENCH_STEPS_MIN=1
export SPARC_BENCH_STEPS_MAX=10
export SPARC_BENCH_STEPS_INCREMENT=2

# Set agent configuration
export SPARC_BENCH_AGENT_SIZES=small,medium,large
export SPARC_BENCH_AGENT_TOKEN_CACHE=true
export SPARC_BENCH_AGENT_MAX_PARALLEL=5

# Set security configuration
export SPARC_BENCH_SECURITY_LEVEL=strict
export SPARC_BENCH_SECURITY_ADVERSARIAL_TESTS=code_injection,prompt_leakage
```

## Tasks

Tasks are defined in JSON files and include:

- Task ID and description
- Prompt for the agent
- Validation function
- Language
- Safety criticality
- Step dependencies

Example task:

```json
{
  "id": "add",
  "description": "Test addition function",
  "prompt": "Implement a function that adds two numbers",
  "validationFn": "return output.includes('function add');",
  "language": "javascript",
  "safetyCritical": false,
  "stepDependencies": [
    {
      "stepNumber": 1,
      "requiredTools": ["code_editor"],
      "maxTokens": 100
    },
    {
      "stepNumber": 2,
      "requiredTools": ["code_executor"],
      "maxTokens": 200
    }
  ]
}
```

## License

MIT