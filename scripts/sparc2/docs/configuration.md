# SPARC2 Configuration Guide

This guide explains how to configure SPARC2 to suit your specific needs, covering configuration files, environment variables, and various configuration options.

## Table of Contents

- [Configuration Files](#configuration-files)
- [Environment Variables](#environment-variables)
- [Processing Modes](#processing-modes)
- [Execution Modes](#execution-modes)
- [Diff Modes](#diff-modes)
- [Model Configuration](#model-configuration)
- [Advanced Configuration](#advanced-configuration)

## Configuration Files

SPARC2 uses TOML configuration files for its settings. By default, it looks for:

- `config/sparc2-config.toml`: General configuration
- `config/agent-config.toml`: Agent-specific configuration

You can specify a custom configuration path using the `SPARC2_CONFIG_PATH` environment variable:

```bash
export SPARC2_CONFIG_PATH=/path/to/your/config.toml
```

### Basic Configuration File Structure

Here's a basic configuration file structure:

```toml
# SPARC 2.0 Configuration (TOML)
[execution]
mode = "semi"          # Options: automatic, semi, manual, custom
diff_mode = "file"     # Options: file, function
processing = "sequential"  # Options: parallel, sequential, concurrent, swarm

[logging]
enable = true
vector_logging = true

[rollback]
checkpoint_enabled = true
temporal_rollback = true

[models]
reasoning = "gpt-4o"   # For architecture, planning, problem solving
instruct = "gpt-4o"    # For instructing code changes
```

## Environment Variables

SPARC2 requires several environment variables to be set. Create a `.env` file in your project root with the following variables:

```
# Required
OPENAI_API_KEY=your_openai_api_key
E2B_API_KEY=your_e2b_api_key

# Optional
OPENROUTER_API_KEY=your_openrouter_api_key
SPARC2_CONFIG_PATH=/path/to/your/config.toml
```

### Required Environment Variables

- `OPENAI_API_KEY`: Your OpenAI API key for accessing models like GPT-4
- `E2B_API_KEY`: Your E2B API key for secure code execution

### Optional Environment Variables

- `OPENROUTER_API_KEY`: Your OpenRouter API key for accessing additional models
- `SPARC2_CONFIG_PATH`: Custom path to your configuration file

## Processing Modes

SPARC2 supports multiple processing modes that determine how code changes are processed:

### Parallel

Process multiple code changes simultaneously. This is ideal for large projects where changes can be made independently.

```toml
[execution]
processing = "parallel"
```

### Sequential

Process changes one after another in a defined order. This is useful when changes depend on each other.

```toml
[execution]
processing = "sequential"
```

### Concurrent

Use asynchronous operations to ensure I/O-bound tasks don't block others. This is a balanced approach that combines aspects of parallel and sequential processing.

```toml
[execution]
processing = "concurrent"
```

### Swarm

Coordinate multiple agents to work on different aspects of the same problem. This is the most advanced mode and is suitable for complex projects.

```toml
[execution]
processing = "swarm"
```

## Execution Modes

SPARC2 supports multiple execution modes that determine how code changes are applied:

### Automatic

Autonomously makes and commits code changes without user intervention.

```toml
[execution]
mode = "automatic"
```

### Semi-automatic

Proposes modifications and waits for your approval before applying them.

```toml
[execution]
mode = "semi"
```

### Manual

Provides analysis but requires manual implementation of changes.

```toml
[execution]
mode = "manual"
```

### Custom

Define your own workflow with custom steps.

```toml
[execution]
mode = "custom"
```

## Diff Modes

SPARC2 supports different modes for tracking changes:

### File-level Diff Tracking

By default, SPARC2 tracks changes at the file level for optimal performance.

```toml
[execution]
diff_mode = "file"
```

### Function-level Diff Tracking

For more granular tracking, you can enable function-level diff tracking.

```toml
[execution]
diff_mode = "function"
```

## Model Configuration

SPARC2 uses different models for different tasks:

### Reasoning Model

Used for architecture, planning, and problem-solving.

```toml
[models]
reasoning = "gpt-4o"
```

### Instruct Model

Used for instructing code changes.

```toml
[models]
instruct = "gpt-4o"
```

## Advanced Configuration

### Logging Configuration

Configure logging settings:

```toml
[logging]
enable = true              # Enable logging
vector_logging = true      # Enable vector logging for similarity search
log_level = "info"         # Log level (debug, info, warn, error)
log_file = "sparc2.log"    # Log file path
```

### Rollback Configuration

Configure rollback settings:

```toml
[rollback]
checkpoint_enabled = true   # Enable Git checkpoints
temporal_rollback = true    # Enable temporal rollback
max_checkpoints = 10        # Maximum number of checkpoints to keep
```

### Vector Store Configuration

Configure vector store settings for similarity search:

```toml
[vector_store]
enable = true                # Enable vector store
provider = "pinecone"        # Vector store provider (pinecone, milvus, etc.)
index_name = "sparc2-index"  # Vector store index name
dimension = 1536             # Vector dimension
```

### E2B Code Interpreter Configuration

Configure E2B Code Interpreter settings:

```toml
[e2b]
timeout = 30000              # Timeout in milliseconds
stream = true                # Stream output
default_language = "python"  # Default language