# Execution Modes

SPARC2 offers multiple execution modes that determine how code changes are applied. This guide explains each mode in detail, including when to use them and how to configure them.

## Table of Contents

- [Overview](#overview)
- [Automatic Mode](#automatic-mode)
- [Semi-Automatic Mode](#semi-automatic-mode)
- [Manual Mode](#manual-mode)
- [Custom Mode](#custom-mode)
- [Choosing the Right Execution Mode](#choosing-the-right-execution-mode)
- [Configuration](#configuration)
- [Examples](#examples)

## Overview

Execution modes determine how SPARC2 applies changes to your code. The choice of execution mode affects the level of control you have over the changes and the amount of automation provided by SPARC2.

## Automatic Mode

Automatic mode allows SPARC2 to autonomously make and commit code changes without user intervention.

### When to Use

- For routine, low-risk changes
- In CI/CD pipelines
- When you trust the AI's judgment
- For batch processing of multiple files

### How It Works

1. SPARC2 analyzes the code
2. It identifies issues and generates fixes
3. Changes are applied automatically
4. A checkpoint is created (if enabled)

### Benefits

- Fastest mode for making changes
- Minimal user intervention required
- Ideal for batch processing
- Works well in automated workflows

### Limitations

- Less control over changes
- May apply undesired changes
- Not suitable for critical code without review

## Semi-Automatic Mode

Semi-automatic mode proposes modifications and waits for your approval before applying them.

### When to Use

- For most development tasks
- When you want to review changes
- For learning how SPARC2 works
- When working with important code

### How It Works

1. SPARC2 analyzes the code
2. It identifies issues and generates fixes
3. Changes are presented for your review
4. You approve or reject each change
5. Approved changes are applied

### Benefits

- Balance between automation and control
- Educational value in reviewing changes
- Prevents undesired modifications
- Still relatively efficient

### Limitations

- Requires user interaction
- Slower than automatic mode
- Not suitable for batch processing

## Manual Mode

Manual mode provides analysis but requires manual implementation of changes.

### When to Use

- For critical code sections
- When learning from SPARC2's suggestions
- When you want full control over implementation
- For complex changes requiring human judgment

### How It Works

1. SPARC2 analyzes the code
2. It identifies issues and suggests fixes
3. You implement the changes manually
4. SPARC2 can verify your changes if requested

### Benefits

- Maximum control over changes
- Educational value
- Suitable for critical code
- Allows for creative implementation

### Limitations

- Most time-consuming mode
- Requires more user effort
- Not suitable for batch processing

## Custom Mode

Custom mode allows you to define your own workflow with custom steps.

### When to Use

- For specialized workflows
- When integrating with other tools
- For complex projects with specific requirements
- When you need fine-grained control over the process

### How It Works

1. Define custom workflow steps in configuration
2. SPARC2 follows your defined workflow
3. Custom hooks can be triggered at specific points
4. Integration with external tools is possible

### Benefits

- Maximum flexibility
- Can be tailored to specific projects
- Integrates with existing workflows
- Supports complex scenarios

### Limitations

- Requires configuration
- More complex to set up
- May require custom scripts

## Choosing the Right Execution Mode

| Execution Mode  | Control Level | Speed | User Interaction | Use Case                      |
|-----------------|---------------|-------|------------------|-------------------------------|
| Automatic       | Low           | Fast  | None             | Batch processing, CI/CD       |
| Semi-automatic  | Medium        | Medium| Moderate         | General development           |
| Manual          | High          | Slow  | High             | Critical code, learning       |
| Custom          | Variable      | Variable | Variable      | Specialized workflows         |

## Configuration

Set the execution mode in your configuration file:

```toml
[execution]
mode = "semi"  # Options: automatic, semi, manual, custom
```

Or specify it when running a command:

```bash
sparc2 analyze --files src/app.js --mode semi
```

For custom mode, you can define workflow steps:

```toml
[execution]
mode = "custom"

[execution.custom_workflow]
steps = [
  "analyze",
  "generate_suggestions",
  "run_custom_script",
  "present_changes",
  "apply_approved_changes"
]

[execution.hooks]
pre_analyze = "scripts/pre_analyze.sh"
post_analyze = "scripts/post_analyze.sh"
pre_modify = "scripts/pre_modify.sh"
post_modify = "scripts/post_modify.sh"
```

## Examples

### Automatic Mode Example

```bash
# Analyze and fix multiple files automatically
sparc2 analyze --files "src/**/*.js" --mode automatic
```

### Semi-Automatic Mode Example

```bash
# Analyze and interactively fix a file
sparc2 modify --files src/app.js --suggestions "Fix performance issues" --mode semi
```

### Manual Mode Example

```bash
# Get suggestions without applying changes
sparc2 analyze --files src/app.js --mode manual --output suggestions.json
```

### Custom Mode Example

```bash
# Use a custom workflow defined in configuration
sparc2 analyze --files src/app.js --mode custom