# Processing Modes

SPARC2 offers multiple processing modes that determine how code changes are processed and applied. This guide explains each mode in detail, including when to use them and how to configure them.

## Table of Contents

- [Overview](#overview)
- [Parallel Processing](#parallel-processing)
- [Sequential Processing](#sequential-processing)
- [Concurrent Processing](#concurrent-processing)
- [Swarm Processing](#swarm-processing)
- [Choosing the Right Processing Mode](#choosing-the-right-processing-mode)
- [Configuration](#configuration)
- [Examples](#examples)

## Overview

Processing modes determine how SPARC2 handles multiple code changes across files or functions. The choice of processing mode can significantly impact performance, accuracy, and resource usage.

## Parallel Processing

Parallel processing allows SPARC2 to process multiple code changes simultaneously, using multiple threads or processes.

### When to Use

- Large projects with many independent files
- When speed is a priority
- When changes don't depend on each other

### How It Works

1. SPARC2 analyzes all files in parallel
2. Each file is processed by a separate agent
3. Changes are applied independently

### Benefits

- Faster processing for large projects
- Better utilization of system resources
- Reduced overall processing time

### Limitations

- May miss interdependencies between files
- Higher resource usage
- Potential for conflicts if files are related

## Sequential Processing

Sequential processing handles code changes one after another in a defined order.

### When to Use

- When changes depend on each other
- For smaller projects
- When accuracy is more important than speed

### How It Works

1. SPARC2 analyzes files in the order specified
2. Each file is fully processed before moving to the next
3. Changes are applied sequentially

### Benefits

- Ensures changes are applied in the correct order
- Reduces the chance of conflicts
- More predictable behavior

### Limitations

- Slower for large projects
- Doesn't utilize multiple cores efficiently
- May be unnecessarily cautious for independent changes

## Concurrent Processing

Concurrent processing combines aspects of both parallel and sequential processing, using asynchronous operations to ensure I/O-bound tasks don't block others.

### When to Use

- Mixed projects with both dependent and independent changes
- When you want a balance between speed and accuracy
- For projects with I/O-bound operations

### How It Works

1. SPARC2 analyzes files concurrently
2. I/O operations are performed asynchronously
3. Dependencies are respected through a task queue

### Benefits

- Better performance than sequential processing
- More accurate than fully parallel processing
- Efficient use of system resources

### Limitations

- More complex to configure
- May still encounter some conflicts
- Requires careful dependency management

## Swarm Processing

Swarm processing coordinates multiple agents to work on different aspects of the same problem, using a collaborative approach.

### When to Use

- Complex projects requiring multiple specialized agents
- When different aspects of the code require different expertise
- For large-scale refactoring or analysis

### How It Works

1. SPARC2 creates a swarm of specialized agents
2. Each agent focuses on a specific aspect (e.g., performance, security, style)
3. Agents collaborate and share information
4. Changes are coordinated through a central manager

### Benefits

- Highly specialized analysis and modifications
- Can handle complex interdependencies
- Scalable to very large projects

### Limitations

- Most resource-intensive option
- Requires careful configuration
- May be overkill for simple projects

## Choosing the Right Processing Mode

| Processing Mode | Project Size | Interdependencies | Priority | Resource Usage |
|-----------------|--------------|-------------------|----------|---------------|
| Parallel        | Large        | Low               | Speed    | High          |
| Sequential      | Small        | High              | Accuracy | Low           |
| Concurrent      | Medium       | Medium            | Balance  | Medium        |
| Swarm           | Very Large   | Complex           | Quality  | Very High     |

## Configuration

Set the processing mode in your configuration file:

```toml
[execution]
processing = "parallel"  # Options: parallel, sequential, concurrent, swarm
```

Or specify it when running a command:

```bash
sparc2 analyze --files src/app.js --processing parallel
```

## Examples

### Parallel Processing Example

```bash
# Analyze multiple independent files in parallel
sparc2 analyze --files src/utils.js,src/components.js,src/helpers.js --processing parallel
```

### Sequential Processing Example

```bash
# Modify files with dependencies in a specific order
sparc2 modify --files src/models.js,src/controllers.js,src/views.js --processing sequential --suggestions "Update API endpoints"
```

### Concurrent Processing Example

```bash
# Balance speed and accuracy for a medium-sized project
sparc2 analyze --files src/*.js --processing concurrent
```

### Swarm Processing Example

```bash
# Use specialized agents for a complex refactoring
sparc2 modify --files src/**/*.js --processing swarm --suggestions "Refactor to use async/await instead of promises"