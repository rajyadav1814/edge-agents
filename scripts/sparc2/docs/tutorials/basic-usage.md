# Basic Usage Tutorial

This tutorial will guide you through the basic usage of SPARC2, covering installation, configuration, and your first code analysis and modification.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Basic Configuration](#basic-configuration)
- [Your First Code Analysis](#your-first-code-analysis)
- [Your First Code Modification](#your-first-code-modification)
- [Executing Code](#executing-code)
- [Creating a Checkpoint](#creating-a-checkpoint)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, make sure you have:

- Node.js (v16 or later) or Deno (v1.32 or later) installed
- An OpenAI API key
- An E2B API key

## Installation

### NPM Installation (Recommended)

```bash
# Install globally
npm install -g @agentics.org/sparc2

# Or install locally in your project
npm install --save-dev @agentics.org/sparc2
```

### Manual Installation

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

Create a `.env` file in your project root with your API keys:

```
OPENAI_API_KEY=your_openai_api_key
E2B_API_KEY=your_e2b_api_key
```

Create a basic configuration file at `config/sparc2-config.toml`:

```toml
# SPARC 2.0 Configuration (TOML)
[execution]
mode = "semi"          # Start with semi-automatic mode for safety
diff_mode = "file"     # File-level diff tracking
processing = "sequential"  # Sequential processing

[logging]
enable = true
vector_logging = true

[models]
reasoning = "gpt-4o"   # For architecture, planning, problem solving
instruct = "gpt-4o"    # For instructing code changes
```

## Your First Code Analysis

Let's create a simple JavaScript file with a bug to analyze:

```bash
# Create a test file
mkdir -p test-project
cat > test-project/calculator.js << 'EOF'
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// This function has a bug
function multiply(a, b) {
  return a + b; // Should be a * b
}

function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

module.exports = {
  add,
  subtract,
  multiply,
  divide
};
EOF
```

Now, let's analyze this file with SPARC2:

```bash
sparc2 analyze --files test-project/calculator.js
```

SPARC2 will analyze the file and identify issues, such as the bug in the `multiply` function. The output will look something like this:

```
Analysis Results:
- Issue found in function 'multiply': Incorrect implementation. The function is using addition (a + b) instead of multiplication (a * b).
- Suggestion: Replace 'return a + b;' with 'return a * b;' in the multiply function.
```

## Your First Code Modification

Now, let's fix the bug in the `multiply` function:

```bash
sparc2 modify --files test-project/calculator.js --suggestions "Fix the bug in the multiply function"
```

In semi-automatic mode, SPARC2 will show you the proposed changes and ask for confirmation:

```
Proposed Changes:
@@ -10,7 +10,7 @@
 
 // This function has a bug
 function multiply(a, b) {
-  return a + b; // Should be a * b
+  return a * b;
 }
 
 function divide(a, b) {

Apply these changes? (y/n): 
```

Type `y` to apply the changes.

## Executing Code

Let's create a simple test script to verify our fix:

```bash
cat > test-project/test.js << 'EOF'
const calculator = require('./calculator');

console.log('2 + 3 =', calculator.add(2, 3));
console.log('5 - 2 =', calculator.subtract(5, 2));
console.log('4 * 5 =', calculator.multiply(4, 5));
console.log('10 / 2 =', calculator.divide(10, 2));
EOF
```

Now, let's execute the test script:

```bash
sparc2 execute --file test-project/test.js
```

You should see the correct output:

```
2 + 3 = 5
5 - 2 = 3
4 * 5 = 20
10 / 2 = 5
```

## Creating a Checkpoint

Let's create a checkpoint to save our changes:

```bash
sparc2 checkpoint --message "Fixed multiplication bug"
```

This will create a Git commit with the specified message, allowing you to track changes and roll back if needed.

## Next Steps

Congratulations! You've completed your first SPARC2 project. Here are some next steps to explore:

- [Code Analysis Tutorial](code-analysis.md) - Learn more about code analysis features
- [Code Modification Tutorial](code-modification.md) - Learn more about code modification features
- [Advanced Usage](../advanced-usage/processing-modes.md) - Explore advanced features like different processing modes
- [CLI Guide](../cli-guide.md) - Learn about all available commands