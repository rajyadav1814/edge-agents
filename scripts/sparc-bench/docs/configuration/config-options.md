# Configuration Options

This guide explains all available configuration options for SPARC-Bench, allowing you to customize the benchmarking process to your specific needs.

## Configuration File Format

SPARC-Bench uses TOML files for configuration. The default configuration file is located at `config.toml` in the root directory of SPARC-Bench.

## Basic Configuration Structure

A typical configuration file has the following structure:

```toml
[benchmark]
name = "SPARC2 Benchmark Suite"
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

## Configuration Sections

### Benchmark Section

The `[benchmark]` section contains general information about the benchmark suite:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `name` | string | Name of the benchmark suite | "SPARC2 Benchmark Suite" |
| `version` | string | Version of the benchmark suite | "1.0.0" |
| `description` | string | Description of the benchmark suite | "" |
| `author` | string | Author of the benchmark suite | "" |

Example:

```toml
[benchmark]
name = "Custom SPARC2 Benchmark Suite"
version = "1.2.0"
description = "A custom benchmark suite for evaluating SPARC2 agents"
author = "Your Name"
```

### Metrics Section

The `[metrics]` section configures which metrics to include in the benchmark:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `include` | string[] | Metrics to include in the benchmark | ["accuracy", "efficiency", "safety", "adaptability"] |
| `weights` | table | Weights for each metric when calculating overall score | {} |

Example:

```toml
[metrics]
include = ["accuracy", "efficiency", "safety", "adaptability"]
weights = { accuracy = 0.4, efficiency = 0.2, safety = 0.3, adaptability = 0.1 }
```

### Agent Section

The `[agent]` section configures the agent settings:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `sizes` | string[] | Agent sizes to benchmark | ["small", "medium", "large"] |
| `tokenCacheEnabled` | boolean | Whether to enable token caching | true |
| `maxParallelAgents` | number | Maximum number of parallel agents | 2 |
| `timeout` | number | Default timeout in milliseconds | 30000 |
| `retryCount` | number | Number of retries for failed tests | 1 |
| `retryDelay` | number | Delay between retries in milliseconds | 1000 |

Example:

```toml
[agent]
sizes = ["small", "medium", "large"]
tokenCacheEnabled = true
maxParallelAgents = 4
timeout = 60000
retryCount = 2
retryDelay = 2000
```

### Execution Section

The `[execution]` section configures how benchmarks are executed:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `processing` | string | Processing mode ("sequential" or "parallel") | "sequential" |
| `maxConcurrent` | number | Maximum number of concurrent benchmarks | 1 |
| `cacheResults` | boolean | Whether to cache benchmark results | true |
| `cacheDir` | string | Directory for cached results | "./cache" |
| `resultsDir` | string | Directory for benchmark results | "./results" |

Example:

```toml
[execution]
processing = "parallel"
maxConcurrent = 4
cacheResults = true
cacheDir = "./custom-cache"
resultsDir = "./custom-results"
```

### E2B Section

The `[e2b]` section configures the E2B code execution environment:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `apiKey` | string | E2B API key (prefer using environment variable) | "" |
| `timeout` | number | Default timeout for E2B execution in milliseconds | 30000 |
| `memoryLimit` | number | Memory limit in MB | 1024 |
| `cpuLimit` | number | CPU limit (number of cores) | 2 |

Example:

```toml
[e2b]
timeout = 60000
memoryLimit = 2048
cpuLimit = 4
```

### Logging Section

The `[logging]` section configures logging behavior:

| Option | Type | Description | Default |
|--------|------|-------------|---------|
| `level` | string | Log level ("debug", "info", "warn", "error") | "info" |
| `file` | string | Log file path | "" |
| `format` | string | Log format ("text", "json") | "text" |
| `colors` | boolean | Whether to use colors in console output | true |

Example:

```toml
[logging]
level = "debug"
file = "./logs/sparc-bench.log"
format = "json"
colors = true
```

## Environment Variables

You can also configure SPARC-Bench using environment variables. Environment variables take precedence over configuration file values.

| Environment Variable | Description | Example |
|----------------------|-------------|---------|
| `E2B_API_KEY` | E2B API key | `E2B_API_KEY=your_api_key` |
| `SPARC_BENCH_CONFIG` | Path to config file | `SPARC_BENCH_CONFIG=./custom-config.toml` |
| `SPARC_BENCH_RESULTS_DIR` | Directory for results | `SPARC_BENCH_RESULTS_DIR=./results` |
| `SPARC_BENCH_MAX_CONCURRENT` | Max concurrent benchmarks | `SPARC_BENCH_MAX_CONCURRENT=4` |
| `SPARC_BENCH_TIMEOUT` | Default timeout in ms | `SPARC_BENCH_TIMEOUT=60000` |
| `SPARC_BENCH_LOG_LEVEL` | Log level | `SPARC_BENCH_LOG_LEVEL=debug` |

## Custom Configuration Files

You can specify a custom configuration file using the `--config` option:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --config ./custom-config.toml
```

## Configuration Inheritance

You can create configuration files that inherit from other configuration files:

```toml
# Extended configuration that inherits from the default
inherit = "./config.toml"

[agent]
# Override only specific options
maxParallelAgents = 8
timeout = 120000
```

## Configuration Profiles

You can define multiple configuration profiles in a single file:

```toml
# Base configuration
[benchmark]
name = "SPARC2 Benchmark Suite"
version = "1.0.0"

# Development profile
[profiles.dev]
[profiles.dev.execution]
processing = "sequential"
maxConcurrent = 1

# Production profile
[profiles.prod]
[profiles.prod.execution]
processing = "parallel"
maxConcurrent = 8
```

To use a specific profile:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --profile prod
```

## Dynamic Configuration

You can use environment variables within your configuration file:

```toml
[e2b]
apiKey = "${E2B_API_KEY}"
timeout = ${E2B_TIMEOUT:-30000}  # Use default if not set
```

## Configuration Validation

SPARC-Bench validates your configuration file and reports any errors:

```bash
deno run --allow-read sparc-bench.ts validate --config ./custom-config.toml
```

This will check your configuration file for errors and provide suggestions for improvement.

## Best Practices

1. **Use Environment Variables for Secrets**: Never store API keys or other secrets directly in configuration files.

2. **Version Control**: Include a sample configuration file in version control, but exclude files with sensitive information.

3. **Environment-Specific Configurations**: Use different configuration files or profiles for different environments (development, testing, production).

4. **Documentation**: Document any custom configuration options specific to your project.

5. **Validation**: Regularly validate your configuration files to catch errors early.