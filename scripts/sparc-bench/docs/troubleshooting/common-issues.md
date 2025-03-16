# Troubleshooting Common Issues

This guide addresses common issues you might encounter when using SPARC-Bench and provides solutions to help you resolve them quickly.

## Installation Issues

### Deno Not Found

**Symptom**: You see an error like `command not found: deno` when trying to run SPARC-Bench.

**Solution**:
1. Install Deno following the [installation instructions](../getting-started/installation.md)
2. Make sure Deno is in your PATH
3. Verify the installation with `deno --version`

### Permission Errors

**Symptom**: You see permission errors when running SPARC-Bench scripts.

**Solution**:
1. Make sure to include all necessary permissions when running Deno scripts:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts
```

2. If you're still seeing permission errors, check file permissions:

```bash
chmod +x sparc-bench.ts
```

## Configuration Issues

### Missing Configuration File

**Symptom**: You see an error like `Error: Cannot find configuration file at ./config.toml`.

**Solution**:
1. Make sure you're running the command from the correct directory
2. Create a config.toml file if it doesn't exist:

```bash
cp config.example.toml config.toml
```

3. Specify a custom configuration file path:

```bash
deno run --allow-read --allow-write sparc-bench.ts run --config /path/to/your/config.toml
```

### Invalid Configuration

**Symptom**: You see an error like `Error: Invalid configuration: ...`.

**Solution**:
1. Check your configuration file for syntax errors
2. Validate your configuration:

```bash
deno run --allow-read sparc-bench.ts validate --config ./config.toml
```

3. Compare with the example configuration file
4. Check the [Configuration Options](../configuration/config-options.md) documentation

## E2B Integration Issues

### E2B API Key Not Found

**Symptom**: You see an error like `Error: E2B API key not found`.

**Solution**:
1. Make sure you have an E2B API key
2. Set the API key in your environment:

```bash
export E2B_API_KEY=your_api_key_here
```

3. Or add it to your `.env` file:

```
E2B_API_KEY=your_api_key_here
```

4. Make sure to include `--allow-env` when running Deno scripts

### E2B Connection Failed

**Symptom**: You see an error like `Error: Failed to connect to E2B API`.

**Solution**:
1. Check your internet connection
2. Verify your API key is correct
3. Check if the E2B service is down
4. Try with a different API key if available
5. Check for firewall or proxy issues

### Package Installation Failed

**Symptom**: You see an error like `Error: Failed to install package X`.

**Solution**:
1. Check if the package exists and is spelled correctly
2. Try installing the package manually:

```bash
deno run --allow-read --allow-write --allow-env --allow-net scripts/e2b/e2b-python-packages.ts install numpy pandas
```

3. Check for network issues
4. Try with a different package version

## Benchmark Execution Issues

### Benchmark Not Found

**Symptom**: You see an error like `Error: Benchmark not found: X`.

**Solution**:
1. List available benchmarks:

```bash
deno run --allow-read sparc-bench.ts list
```

2. Check the spelling of the benchmark name
3. Make sure the benchmark is registered in the benchmark manager
4. Create the benchmark if it doesn't exist

### Test Case Timeout

**Symptom**: You see an error like `Error: Test case X timed out after Y ms`.

**Solution**:
1. Increase the timeout for the specific test case:

```typescript
// In your benchmark definition
{
  id: "test-case-id",
  input: "...",
  expectedOutput: "...",
  timeout: 60000  // 60 seconds
}
```

2. Increase the global timeout:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark X --timeout 60000
```

3. Optimize the test case to run faster
4. Split complex test cases into smaller ones

### Out of Memory

**Symptom**: You see an error like `Error: JavaScript heap out of memory`.

**Solution**:
1. Increase the memory limit for Deno:

```bash
NODE_OPTIONS=--max-old-space-size=8192 deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts
```

2. Run fewer benchmarks in parallel:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all --max-concurrent 1
```

3. Optimize your benchmarks to use less memory
4. Split large benchmarks into smaller ones

## Results and Analysis Issues

### Results Not Saved

**Symptom**: Benchmark results are not being saved to the results directory.

**Solution**:
1. Make sure the results directory exists:

```bash
mkdir -p results
```

2. Check file permissions:

```bash
chmod 755 results
```

3. Specify an output file explicitly:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark X --output ./my-results.json
```

4. Check disk space

### Invalid Results Format

**Symptom**: You see an error like `Error: Invalid results format`.

**Solution**:
1. Check if the results file is valid JSON:

```bash
cat results/benchmark-results.json | jq
```

2. Try with a different results file
3. Regenerate the results by running the benchmark again
4. Check for file corruption

## CLI Issues

### Unknown Command

**Symptom**: You see an error like `Error: Unknown command: X`.

**Solution**:
1. Check the available commands:

```bash
deno run --allow-read sparc-bench.ts help
```

2. Make sure you're using the correct command syntax
3. Update to the latest version of SPARC-Bench

### Invalid Option

**Symptom**: You see an error like `Error: Invalid option: X`.

**Solution**:
1. Check the available options for the command:

```bash
deno run --allow-read sparc-bench.ts help [command]
```

2. Make sure you're using the correct option syntax
3. Check for typos in option names

## Performance Issues

### Slow Benchmark Execution

**Symptom**: Benchmarks are taking a very long time to run.

**Solution**:
1. Run benchmarks in parallel:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all --parallel
```

2. Increase the number of concurrent benchmarks:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --all --parallel --max-concurrent 4
```

3. Use the optimized benchmark manager:

```typescript
import { createOptimizedBenchmarkManager } from "./src/benchmarks/optimized-benchmark-manager.ts";

const benchmarkManager = createOptimizedBenchmarkManager({
  maxConcurrent: 4,
  useCache: true
});
```

4. Run only specific benchmarks instead of all:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark X
```

### High Memory Usage

**Symptom**: SPARC-Bench is using a lot of memory.

**Solution**:
1. Run fewer benchmarks in parallel
2. Enable garbage collection:

```bash
NODE_OPTIONS=--expose-gc deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts
```

3. Use the optimized benchmark manager with memory optimization:

```typescript
const benchmarkManager = createOptimizedBenchmarkManager({
  memoryOptimization: true
});
```

4. Run benchmarks one at a time:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark X --parallel false
```

## Advanced Troubleshooting

### Debugging Mode

To enable debugging mode for more detailed logs:

```bash
DEBUG=true deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts
```

### Verbose Output

To get verbose output during benchmark execution:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark X --verbose
```

### Log Files

To save logs to a file:

```bash
deno run --allow-read --allow-write --allow-env --allow-net sparc-bench.ts run --benchmark X --log-file ./sparc-bench.log
```

### Clean Cache

To clean the cache and start fresh:

```bash
deno run --allow-read --allow-write sparc-bench.ts clean-cache
```

### Diagnostic Information

To get diagnostic information about your system:

```bash
deno run --allow-read --allow-env sparc-bench.ts diagnostics
```

## Getting Help

If you're still experiencing issues after trying these solutions:

1. Check the [GitHub Issues](https://github.com/your-org/sparc-bench/issues) for similar problems
2. Search the [Documentation](../README.md) for more information
3. Run the diagnostics command and include the output when asking for help
4. Create a new issue with detailed information about your problem

## Common Error Messages and Solutions

| Error Message | Possible Cause | Solution |
|---------------|----------------|----------|
| `Error: Cannot find module` | Missing dependency | Install the required dependency |
| `Error: Permission denied` | Insufficient permissions | Add the necessary Deno permissions |
| `Error: Failed to fetch` | Network issue | Check your internet connection |
| `Error: Unexpected token` | Syntax error | Fix the syntax error in your code |
| `Error: Out of memory` | Memory limit exceeded | Increase memory limit or optimize code |
| `Error: Timeout` | Operation took too long | Increase timeout or optimize code |
| `Error: Not found` | Resource not found | Check if the resource exists |
| `Error: Invalid argument` | Incorrect argument | Check the argument syntax and value |