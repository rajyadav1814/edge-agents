# Code Analysis Examples

This document provides practical examples of using SPARC2 for code analysis in different scenarios and programming languages.

## Table of Contents

- [Basic Code Analysis](#basic-code-analysis)
- [Multi-File Analysis](#multi-file-analysis)
- [Language-Specific Analysis](#language-specific-analysis)
  - [JavaScript](#javascript)
  - [Python](#python)
  - [TypeScript](#typescript)
- [Advanced Analysis](#advanced-analysis)
  - [Performance Analysis](#performance-analysis)
  - [Security Analysis](#security-analysis)
  - [Code Quality Analysis](#code-quality-analysis)
- [Customizing Analysis](#customizing-analysis)

## Basic Code Analysis

### Analyzing a Single File

Let's start with a simple JavaScript file that has a few issues:

```javascript
// calculator.js
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

// This function could be improved
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  var result = a / b;
  return result;
}
```

To analyze this file, run:

```bash
sparc2 analyze --files calculator.js
```

SPARC2 will identify issues and provide suggestions:

```
Analysis Results:
1. Issue: Bug in multiply function
   - Line 10: Function uses addition instead of multiplication
   - Suggestion: Replace 'return a + b;' with 'return a * b;'

2. Issue: Inefficient code in divide function
   - Line 16-18: Unnecessary variable assignment
   - Suggestion: Simplify to 'return a / b;' after the null check

3. Issue: Inconsistent error handling
   - Line 15: Error message could be more descriptive
   - Suggestion: Consider 'Cannot divide by zero' or include parameter values

4. Issue: Missing JSDoc comments
   - All functions lack documentation
   - Suggestion: Add JSDoc comments to describe parameters and return values
```

### Saving Analysis Results

You can save the analysis results to a file:

```bash
sparc2 analyze --files calculator.js --output analysis.json
```

This creates a JSON file with detailed analysis that can be used for later reference or for the `modify` command.

## Multi-File Analysis

SPARC2 can analyze multiple files at once:

```bash
sparc2 analyze --files src/utils.js,src/components.js,src/app.js
```

You can also use glob patterns (with appropriate quoting for your shell):

```bash
sparc2 analyze --files "src/**/*.js"
```

## Language-Specific Analysis

### JavaScript

Analyzing a React component:

```bash
sparc2 analyze --files src/components/Button.jsx
```

Example output:

```
Analysis Results:
1. Issue: Potential performance issue
   - Component re-renders unnecessarily
   - Suggestion: Use React.memo or implement shouldComponentUpdate

2. Issue: Prop types validation missing
   - No PropTypes or TypeScript types defined
   - Suggestion: Add PropTypes validation or convert to TypeScript

3. Issue: Event handler defined inside render
   - Creates a new function on each render
   - Suggestion: Move handler to class property or use useCallback
```

### Python

Analyzing a Python file:

```bash
sparc2 analyze --files src/data_processor.py
```

Example output:

```
Analysis Results:
1. Issue: Inefficient list comprehension
   - Line 25: Using nested loops where a generator would be more efficient
   - Suggestion: Convert to generator expression

2. Issue: Exception handling too broad
   - Line 42: Catching all exceptions can hide bugs
   - Suggestion: Catch specific exceptions (e.g., ValueError, IOError)

3. Issue: Missing type hints
   - Functions lack type annotations
   - Suggestion: Add type hints for parameters and return values
```

### TypeScript

Analyzing a TypeScript file:

```bash
sparc2 analyze --files src/services/api.ts
```

Example output:

```
Analysis Results:
1. Issue: Any type used
   - Line 15: Function returns 'any' type
   - Suggestion: Define a proper interface for the return type

2. Issue: Promise error handling
   - Line 30: Missing error handling in Promise chain
   - Suggestion: Add .catch() handler or use try/catch with async/await

3. Issue: Unused variables
   - Line 45: Variable 'config' is declared but never used
   - Suggestion: Remove unused variable or use it
```

## Advanced Analysis

### Performance Analysis

Focus on performance issues:

```bash
sparc2 analyze --files src/app.js --focus performance
```

Example output:

```
Performance Analysis Results:
1. Issue: Inefficient DOM manipulation
   - Line 45: Multiple direct DOM manipulations in a loop
   - Suggestion: Use DocumentFragment or virtual DOM approach

2. Issue: Expensive computation in render loop
   - Line 78: Complex calculation performed on each render
   - Suggestion: Memoize result or move calculation outside render

3. Issue: Large dependency size
   - Importing entire lodash library for a single function
   - Suggestion: Use selective imports (e.g., import { debounce } from 'lodash/debounce')
```

### Security Analysis

Focus on security issues:

```bash
sparc2 analyze --files server.js --focus security
```

Example output:

```
Security Analysis Results:
1. Issue: SQL Injection vulnerability
   - Line 25: User input directly used in SQL query
   - Suggestion: Use parameterized queries or an ORM

2. Issue: Insecure cookie settings
   - Line 42: Cookies missing secure and httpOnly flags
   - Suggestion: Set { secure: true, httpOnly: true } for sensitive cookies

3. Issue: Sensitive information in logs
   - Line 67: Logging user credentials
   - Suggestion: Remove or mask sensitive data in logs
```

### Code Quality Analysis

Focus on code quality:

```bash
sparc2 analyze --files src/ --focus quality
```

Example output:

```
Code Quality Analysis Results:
1. Issue: Inconsistent code style
   - Mixed use of tabs and spaces for indentation
   - Suggestion: Configure and use a linter (e.g., ESLint)

2. Issue: Duplicate code
   - Similar validation logic repeated in multiple files
   - Suggestion: Extract common logic to a shared utility function

3. Issue: Complex functions
   - Several functions exceed 25 lines and have high cyclomatic complexity
   - Suggestion: Break down complex functions into smaller, focused ones
```

## Customizing Analysis

You can customize the analysis by creating a configuration file:

```toml
# sparc2-config.toml
[analysis]
focus = ["performance", "security"]
ignore_patterns = ["**/*.test.js", "**/vendor/**"]
severity_threshold = "warning"

[models]
reasoning = "gpt-4o"
```

Then run the analysis with this configuration:

```bash
sparc2 analyze --files src/ --config sparc2-config.toml