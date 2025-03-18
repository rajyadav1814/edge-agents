# E2B Code Interpreter Integration

SPARC2 integrates with the E2B Code Interpreter to provide secure code execution in a sandboxed environment. This document explains how the E2B integration works, its features, and how to use it effectively.

## Table of Contents

- [Overview](#overview)
- [How It Works](#how-it-works)
- [Supported Languages](#supported-languages)
- [Security Features](#security-features)
- [Using the E2B Code Interpreter](#using-the-e2b-code-interpreter)
  - [Basic Execution](#basic-execution)
  - [Advanced Features](#advanced-features)
- [Configuration](#configuration)
- [Examples](#examples)
- [Troubleshooting](#troubleshooting)

## Overview

The E2B Code Interpreter is a secure, language-agnostic execution environment that allows SPARC2 to build, run, and modify code without relying on a traditional IDE. It creates isolated sandboxes for execution across multiple programming languages.

Key features include:
- Secure sandboxed execution
- Support for multiple programming languages
- File system operations
- Package installation
- Streaming output
- Timeout controls

## How It Works

When you use the `execute` command in SPARC2, the following process occurs:

1. SPARC2 sends the code to the E2B Code Interpreter
2. E2B creates a secure, isolated sandbox environment
3. The code is executed in the sandbox
4. Output, errors, and execution results are returned to SPARC2
5. The sandbox is destroyed after execution

This approach ensures that code execution is secure and doesn't affect your local system.

## Supported Languages

The E2B Code Interpreter supports multiple programming languages, including:

- JavaScript
- TypeScript
- Python
- Go
- Rust
- Ruby
- PHP
- Java
- C/C++
- C#
- Bash

Each language runs in its own optimized environment with appropriate runtime and common libraries pre-installed.

## Security Features

The E2B Code Interpreter includes several security features:

- **Isolated Sandboxes**: Each execution runs in a completely isolated environment
- **Resource Limits**: CPU, memory, and execution time limits prevent resource abuse
- **Network Restrictions**: Network access can be controlled or disabled
- **File System Isolation**: File operations are contained within the sandbox
- **No Persistence**: Sandboxes are destroyed after execution, leaving no traces

These features ensure that code execution is safe, even for untrusted or experimental code.

## Using the E2B Code Interpreter

### Basic Execution

To execute a file using the E2B Code Interpreter:

```bash
sparc2 execute --file path/to/file.js
```

To execute code directly:

```bash
sparc2 execute --code "console.log('Hello, world!')" --language javascript
```

### Advanced Features

#### Specifying Language

You can specify the programming language:

```bash
sparc2 execute --file script.py --language python
```

#### Streaming Output

Enable streaming output to see results in real-time:

```bash
sparc2 execute --file long_process.js --stream
```

#### Setting Timeout

Set a timeout for execution:

```bash
sparc2 execute --file complex_calculation.js --timeout 30000
```

#### Working with Files

The E2B Code Interpreter can work with files within the sandbox:

```bash
sparc2 execute --code "
const fs = require('fs');
fs.writeFileSync('output.txt', 'Hello, world!');
console.log(fs.readFileSync('output.txt', 'utf8'));
" --language javascript
```

#### Installing Packages

You can install packages within the sandbox:

```bash
sparc2 execute --code "
import subprocess
subprocess.run(['pip', 'install', 'numpy'])
import numpy as np
print(np.array([1, 2, 3]).mean())
" --language python
```

## Configuration

Configure the E2B Code Interpreter in your configuration file:

```toml
[e2b]
api_key = "${E2B_API_KEY}"  # Set via environment variable
timeout = 30000             # Default timeout in milliseconds
stream = true               # Stream output by default
default_language = "javascript"  # Default language
```

## Examples

### JavaScript Example

```bash
sparc2 execute --code "
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n-1) + fibonacci(n-2);
}

for (let i = 0; i < 10; i++) {
  console.log(`Fibonacci(${i}) = ${fibonacci(i)}`);
}
" --language javascript
```

### Python Example

```bash
sparc2 execute --code "
def is_prime(n):
    if n <= 1:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False
    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

for i in range(20):
    print(f'{i} is {"prime" if is_prime(i) else "not prime"}')
" --language python
```

### TypeScript Example

```bash
sparc2 execute --code "
interface Person {
  name: string;
  age: number;
}

const people: Person[] = [
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 30 },
  { name: 'Charlie', age: 35 }
];

const averageAge = people.reduce((sum, person) => sum + person.age, 0) / people.length;
console.log(`Average age: ${averageAge}`);
" --language typescript
```

## Troubleshooting

### Common Issues

#### API Key Issues

If you encounter authentication errors:

1. Ensure your E2B API key is correctly set in the `.env` file
2. Verify the API key is valid and not expired
3. Check that the environment variable is properly loaded

#### Timeout Errors

If your code execution times out:

1. Increase the timeout value: `--timeout 60000`
2. Optimize your code to run more efficiently
3. Break down complex operations into smaller parts

#### Package Installation Issues

If package installation fails:

1. Verify the package name is correct
2. Check if the package is available for the specified language
3. Try using a specific version of the package

#### Memory Limits

If you encounter memory limit errors:

1. Optimize your code to use less memory
2. Process data in smaller chunks
3. Avoid large recursive operations