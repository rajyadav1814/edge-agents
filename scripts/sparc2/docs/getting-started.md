# Getting Started with SPARC2

This guide will help you get started with SPARC2, covering installation, basic configuration, and your first project.

## Table of Contents

- [Installation](#installation)
  - [NPM Installation](#npm-installation)
  - [Manual Installation](#manual-installation)
- [Basic Configuration](#basic-configuration)
  - [Environment Variables](#environment-variables)
  - [Configuration Files](#configuration-files)
- [Your First Project](#your-first-project)
  - [Analyzing Code](#analyzing-code)
  - [Modifying Code](#modifying-code)
  - [Executing Code](#executing-code)

## Installation

### NPM Installation

The recommended way to install SPARC2 is via npm:

```bash
# Install globally
npm install -g @agentics.org/sparc2

# Or install locally in your project
npm install --save-dev @agentics.org/sparc2
```

After installation, you can verify that SPARC2 is installed correctly by running:

```bash
sparc2 --version
```

### Manual Installation

Alternatively, you can install SPARC2 manually:

```bash
# Clone the repository
git clone https://github.com/agentics-org/sparc2.git
cd sparc2

# Install dependencies
deno cache --reload src/cli/cli.ts

# Create an alias for easier use
alias sparc2="deno run --allow-read --allow-write --allow-env --allow-net --allow-run /path/to/sparc2/src/cli/cli.ts"
```

## Basic Configuration

### Environment Variables

SPARC2 requires several environment variables to be set. Create a `.env` file in your project root with the following variables:

```
# Required
OPENAI_API_KEY=your_openai_api_key
E2B_API_KEY=your_e2b_api_key

# Optional
OPENROUTER_API_KEY=your_openrouter_api_key
SPARC2_CONFIG_PATH=/path/to/your/config.toml
```

### Configuration Files

SPARC2 uses TOML configuration files. By default, it looks for:

- `config/sparc2-config.toml`: General configuration
- `config/agent-config.toml`: Agent-specific configuration

You can create a basic configuration file like this:

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

## Your First Project

### Analyzing Code

Let's start by analyzing a simple JavaScript file:

```bash
# Create a test file
echo 'function add(a, b) { return a + b; }
function multiply(a, b) { return a + b; }' > test.js

# Analyze the file
sparc2 analyze --files test.js
```

SPARC2 will analyze the file and identify issues, such as the bug in the `multiply` function.

### Modifying Code

Now, let's fix the bug in the `multiply` function:

```bash
sparc2 modify --files test.js --suggestions "Fix the bug in the multiply function"
```

SPARC2 will identify the issue and suggest a fix. In semi-automatic mode, it will ask for your confirmation before applying the changes.

### Executing Code

Finally, let's execute the fixed code:

```bash
sparc2 execute --file test.js
```

SPARC2 will execute the code in a secure sandbox and show you the results.

## Next Steps

Now that you've completed your first SPARC2 project, you can explore more advanced features:

- [CLI Guide](cli-guide.md) - Learn about all available commands
- [Tutorials](tutorials/basic-usage.md) - Step-by-step tutorials for common tasks
- [Advanced Usage](advanced-usage/processing-modes.md) - Explore advanced features and configurations