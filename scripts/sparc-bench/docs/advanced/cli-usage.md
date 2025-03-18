# Advanced CLI Usage

This guide covers advanced command-line interface (CLI) usage for SPARC-Bench, providing detailed information on all available commands, options, and advanced features.

## CLI Structure

The SPARC-Bench CLI follows this general structure:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts [command] [options]
```

## Available Commands

### Run Command

The `run` command executes benchmarks:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--benchmark`, `-b` | Specific benchmark to run | `--benchmark sparc2-code-analysis` |
| `--type`, `-t` | Benchmark type (humaneval, swebench, redcode) | `--type humaneval` |
| `--all`, `-a` | Run all benchmarks | `--all` |
| `--output`, `-o` | Output file for results | `--output results.json` |
| `--verbose`, `-v` | Enable verbose output | `--verbose` |
| `--parallel`, `-p` | Run benchmarks in parallel | `--parallel` |
| `--max-concurrent` | Maximum number of concurrent benchmarks | `--max-concurrent 2` |
| `--timeout` | Timeout in milliseconds | `--timeout 60000` |
| `--config` | Path to custom configuration file | `--config custom-config.toml` |

### List Command

The `list` command displays available benchmarks:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts list [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--type`, `-t` | Filter by benchmark type | `--type humaneval` |
| `--format`, `-f` | Output format (json, table, markdown) | `--format markdown` |

### Analyze Command

The `analyze` command analyzes benchmark results:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts analyze [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--input`, `-i` | Input file with benchmark results | `--input results.json` |
| `--output`, `-o` | Output file for analysis | `--output analysis.md` |
| `--format`, `-f` | Output format (json, markdown) | `--format markdown` |
| `--metrics`, `-m` | Specific metrics to analyze | `--metrics accuracy,efficiency` |
| `--compare`, `-c` | Compare with another results file | `--compare previous-results.json` |

### Create Command

The `create` command creates custom benchmark templates:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts create [options]
```

#### Options

| Option | Description | Example |
|--------|-------------|---------|
| `--type`, `-t` | Benchmark type | `--type humaneval` |
| `--name`, `-n` | Benchmark name | `--name custom-benchmark` |
| `--output`, `-o` | Output directory | `--output ./custom-benchmarks` |
| `--template`, `-T` | Template to use | `--template basic` |

## Advanced Features

### Environment Variables

SPARC-Bench supports several environment variables for configuration:

| Variable | Description | Example |
|----------|-------------|---------|
| `E2B_API_KEY` | API key for E2B code execution | `E2B_API_KEY=your_api_key` |
| `SPARC_BENCH_CONFIG` | Path to default config file | `SPARC_BENCH_CONFIG=./config.toml` |
| `SPARC_BENCH_RESULTS_DIR` | Directory for results | `SPARC_BENCH_RESULTS_DIR=./results` |
| `SPARC_BENCH_MAX_CONCURRENT` | Default max concurrent benchmarks | `SPARC_BENCH_MAX_CONCURRENT=4` |
| `SPARC_BENCH_TIMEOUT` | Default timeout in milliseconds | `SPARC_BENCH_TIMEOUT=30000` |

### Custom Configuration Files

You can create custom configuration files in TOML format:

```toml
[benchmark]
name = "Custom Benchmark Suite"
version = "1.0.0"

[metrics]
include = ["accuracy", "efficiency", "safety", "adaptability"]

[agent]
sizes = ["small", "medium", "large"]
tokenCacheEnabled = true
maxParallelAgents = 2

[execution]
processing = "parallel"
```

### Piping and Redirecting

You can pipe and redirect output for integration with other tools:

```bash
# Save benchmark list to a file
deno run --allow-read sparc-bench.ts list --format json > benchmarks.json

# Use jq to filter results
deno run --allow-read --allow-write sparc-bench.ts run --all --output results.json && cat results.json | jq '.benchmarks[] | select(.accuracy > 0.8)'
```

### Scripting Integration

You can integrate SPARC-Bench into scripts:

```typescript
// custom-benchmark-script.ts
import { BenchmarkManager } from "./src/benchmarks/benchmark-manager.ts";
import { sparc2HumanEvalBenchmark } from "./samples/sparc2-benchmark.ts";

async function runCustomBenchmark() {
  const benchmarkManager = new BenchmarkManager();
  
  // Register custom benchmark
  benchmarkManager.registerBenchmark(sparc2HumanEvalBenchmark);
  
  // Run the benchmark
  const result = await benchmarkManager.runBenchmark("sparc2-code-analysis");
  
  // Process results
  console.log(`Accuracy: ${result.metrics.accuracy * 100}%`);
  
  // Save results
  await Deno.writeTextFile("./custom-results.json", JSON.stringify(result, null, 2));
}

runCustomBenchmark().catch(console.error);
```

Run the script:

```bash
deno run --allow-read --allow-write --allow-env --allow-net custom-benchmark-script.ts
```

## Performance Optimization

### Parallel Execution

For faster benchmark execution, use the `--parallel` flag with `--max-concurrent`:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all --parallel --max-concurrent 4
```

### Caching

Enable caching to improve performance for repeated benchmarks:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all --cache
```

### Resource Limits

Set resource limits for benchmark execution:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark sparc2-code-analysis --memory-limit 1024 --cpu-limit 2
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure you include all necessary Deno permissions
2. **Timeout Errors**: Increase timeout with `--timeout` option
3. **Memory Issues**: Use `--memory-limit` to adjust memory allocation
4. **E2B Connection Errors**: Verify your E2B API key is correct

### Debug Mode

Enable debug mode for detailed logging:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark sparc2-code-analysis --debug
```

### Logging

Control log level with the `--log-level` option:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all --log-level debug
```

Available log levels: `debug`, `info`, `warn`, `error`