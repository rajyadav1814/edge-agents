# SPARC2 CLI Guide

This guide provides a comprehensive reference for the SPARC2 command-line interface (CLI), including all available commands, options, and usage patterns.

## Table of Contents

- [Overview](#overview)
- [Command Reference](#command-reference)
  - [analyze](#analyze)
  - [modify](#modify)
  - [execute](#execute)
  - [search](#search)
  - [checkpoint](#checkpoint)
  - [rollback](#rollback)
  - [config](#config)
- [Common Usage Patterns](#common-usage-patterns)
  - [Basic Analysis Workflow](#basic-analysis-workflow)
  - [Code Modification Workflow](#code-modification-workflow)
  - [Automated Workflows](#automated-workflows)

## Overview

The SPARC2 CLI provides a set of commands for analyzing, modifying, and executing code, as well as managing configuration and version control. The CLI is designed to be intuitive and follows a consistent pattern:

```bash
sparc2 <command> [options]
```

If you installed SPARC2 via npm, the `sparc2` command will be available globally. If you installed manually, you may need to use an alias or the full path to the CLI script.

## Command Reference

### analyze

Analyzes code files for issues and potential improvements.

```bash
sparc2 analyze --files <files> [options]
```

**Options:**
- `--files`: Comma-separated list of files to analyze (required)
- `--output, -o`: Output file for analysis results
- `--model`: Model to use for analysis (default: from config)
- `--mode`: Execution mode (automatic, semi, manual, custom)
- `--diff-mode`: Diff mode (file, function)
- `--processing`: Processing mode (parallel, sequential, concurrent, swarm)

**Example:**
```bash
sparc2 analyze --files src/app.js,src/utils.js --output analysis.json --model gpt-4o --mode semi
```

### modify

Applies suggested modifications to code files.

```bash
sparc2 modify --files <files> --suggestions <suggestions> [options]
```

**Options:**
- `--files`: Comma-separated list of files to modify (required)
- `--suggestions, -s`: Suggestions file or string (required)
- `--model`: Model to use for modifications (default: from config)
- `--mode`: Execution mode (automatic, semi, manual, custom)
- `--diff-mode`: Diff mode (file, function)
- `--processing`: Processing mode (parallel, sequential, concurrent, swarm)

**Example:**
```bash
sparc2 modify --files src/app.js --suggestions "Fix the bug in the multiply function" --mode semi
```

### execute

Executes code in a sandbox environment.

```bash
sparc2 execute --file <file> [options]
```

**Options:**
- `--file`: File to execute
- `--code`: Code to execute (alternative to --file)
- `--language, -l`: Programming language (python, javascript, typescript)
- `--stream`: Stream output (boolean)
- `--timeout`: Timeout in milliseconds

**Example:**
```bash
sparc2 execute --file script.py --language python --stream
```

### search

Searches for similar code changes in the vector store.

```bash
sparc2 search --query <query> [options]
```

**Options:**
- `--query`: Search query (required)
- `--max-results, -n`: Maximum number of results (default: 5)

**Example:**
```bash
sparc2 search --query "Fix multiplication bug" --max-results 10
```

### checkpoint

Creates a git checkpoint with the specified message.

```bash
sparc2 checkpoint --message <message>
```

**Options:**
- `--message, -m`: Checkpoint message (required)

**Example:**
```bash
sparc2 checkpoint --message "Fixed multiplication bug"
```

### rollback

Rolls back to a previous checkpoint.

```bash
sparc2 rollback --commit <commit>
```

**Options:**
- `--commit`: Commit hash or date to rollback to (required)

**Example:**
```bash
sparc2 rollback --commit abc123
```

### config

Manages SPARC2 configuration.

```bash
sparc2 config --action <action> [options]
```

**Options:**
- `--action`: Configuration action (get, set, list) (required)
- `--key`: Configuration key (required for get/set)
- `--value`: Configuration value (required for set)

**Example:**
```bash
sparc2 config --action set --key "models.reasoning" --value "gpt-4o"
```

## Common Usage Patterns

### Basic Analysis Workflow

1. Analyze code files:
   ```bash
   sparc2 analyze --files src/app.js --output analysis.json
   ```

2. Review the analysis results:
   ```bash
   cat analysis.json
   ```

3. Apply suggested modifications:
   ```bash
   sparc2 modify --files src/app.js --suggestions analysis.json
   ```

4. Create a checkpoint:
   ```bash
   sparc2 checkpoint --message "Applied code improvements"
   ```

### Code Modification Workflow

1. Modify code with a specific suggestion:
   ```bash
   sparc2 modify --files src/app.js --suggestions "Optimize the rendering function"
   ```

2. Execute the modified code:
   ```bash
   sparc2 execute --file src/app.js
   ```

3. If the changes are satisfactory, create a checkpoint:
   ```bash
   sparc2 checkpoint --message "Optimized rendering function"
   ```

### Automated Workflows

You can create shell scripts to automate common workflows:

```bash
#!/bin/bash
# analyze-and-fix.sh

# Analyze the code
sparc2 analyze --files "$1" --output analysis.json

# Apply fixes
sparc2 modify --files "$1" --suggestions analysis.json

# Create a checkpoint
sparc2 checkpoint --message "Fixed issues in $1"

# Test the changes
sparc2 execute --file "$1"
```

Then run it with:

```bash
./analyze-and-fix.sh src/app.js