# Installation Guide

This guide provides detailed instructions for installing and setting up SPARC-Bench for benchmarking SPARC2 agents.

## System Requirements

- **Operating System**: Linux, macOS, or Windows (with WSL recommended for Windows)
- **Deno**: Version 1.37.0 or higher
- **Disk Space**: At least 500MB for the benchmarking framework and results
- **Memory**: Minimum 4GB RAM, 8GB recommended for parallel benchmarking
- **E2B Account**: Required for secure code execution

## Prerequisites Installation

### 1. Install Deno

Deno is required to run the SPARC-Bench framework. Install it using one of the following methods:

#### macOS or Linux:

```bash
curl -fsSL https://deno.land/x/install/install.sh | sh
```

#### Windows:

```powershell
iwr https://deno.land/x/install/install.ps1 -useb | iex
```

Verify the installation:

```bash
deno --version
```

### 2. Set Up E2B

1. Create an account at [E2B](https://e2b.dev/) if you don't have one already
2. Generate an API key from your E2B dashboard
3. Make note of your API key for later use

## Installing SPARC-Bench

### Option 1: Clone the Repository

If you're working with the entire edge-agents repository:

```bash
git clone https://github.com/your-org/edge-agents.git
cd edge-agents
```

### Option 2: Standalone Installation

If you want to install SPARC-Bench as a standalone tool:

```bash
git clone https://github.com/your-org/sparc-bench.git
cd sparc-bench
```

## Configuration

### Environment Variables

Create a `.env` file in the `scripts/sparc2` directory with the following content:

```
E2B_API_KEY=your_e2b_api_key_here
```

### Configuration File

The default configuration is in `config.toml`. You can customize it or create your own configuration file:

```toml
[benchmark]
name = "SPARC2 Benchmark"
version = "1.0.0"

[metrics]
include = ["accuracy", "efficiency", "safety", "adaptability"]

[agent]
sizes = ["small", "medium", "large"]
tokenCacheEnabled = true
maxParallelAgents = 2
```

## Verifying Installation

Run a simple test to verify your installation:

```bash
cd scripts/sparc-bench
deno run --allow-read --allow-env test-sparc2.ts
```

If successful, you should see output indicating that the test passed.

## Troubleshooting

### Common Issues

#### Permission Errors

If you encounter permission errors when running Deno scripts:

```bash
# Make sure to include all necessary permissions
deno run --allow-read --allow-write --allow-env --allow-net your-script.ts
```

#### E2B Connection Issues

If you have trouble connecting to E2B:

1. Verify your API key is correct
2. Check your internet connection
3. Ensure your firewall isn't blocking the connection

#### Deno Import Errors

If you see import errors:

1. Check that all dependencies are correctly specified
2. Try clearing the Deno cache: `deno cache --reload`

## Next Steps

Now that you have SPARC-Bench installed, you can:

- Follow the [Quick Start Guide](./quick-start.md) to run your first benchmark
- Explore [Configuration Options](../configuration/config-options.md) to customize your benchmarks
- Check out the [Tutorials](../tutorials/README.md) for step-by-step guides