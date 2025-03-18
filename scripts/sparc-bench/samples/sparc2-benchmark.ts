/**
 * SPARC2 Benchmark Configuration
 * 
 * This file defines benchmark test cases for the SPARC2 system.
 */

import { BenchmarkConfig } from "../src/benchmarks/types.ts";

/**
 * HumanEval benchmark for SPARC2 test-file.js
 * Tests basic code analysis and bug fixing capabilities
 */
export const sparc2HumanEvalBenchmark: BenchmarkConfig = {
  type: "humaneval",
  name: "sparc2-code-analysis",
  description: "Tests SPARC2's ability to analyze and fix bugs in JavaScript code",
  testCases: [
    {
      id: "bug-detection",
      input: `
// Function to check if a function has bugs
function checkForBugs(functionCode) {
  // Simple bug detection: look for common issues
  const bugs = [];
  
  // Check for addition instead of multiplication
  if (functionCode.includes("return a + b") && functionCode.includes("multiply")) {
    bugs.push("Bug detected: Addition used instead of multiplication");
  }
  
  // Check for var usage instead of let/const
  if (functionCode.includes("var ")) {
    bugs.push("Improvement possible: 'var' used instead of 'let' or 'const'");
  }
  
  return bugs.length > 0 ? bugs.join("\\n") : "No bugs detected";
}

// Test with the multiply function from test-file.js
const multiplyFunction = \`
function multiply(a, b) {
  return a + b; // Should be a * b
}
\`;

console.log(checkForBugs(multiplyFunction));
      `,
      expectedOutput: "Bug detected: Addition used instead of multiplication",
      language: "javascript"
    },
    {
      id: "bug-fixing",
      input: `
// Function to fix bugs in code
function fixBugs(functionCode) {
  // Fix multiplication bug
  if (functionCode.includes("return a + b") && functionCode.includes("multiply")) {
    functionCode = functionCode.replace("return a + b", "return a * b");
  }
  
  // Replace var with let
  functionCode = functionCode.replace(/var /g, "let ");
  
  return functionCode;
}

// Test with the divide function from test-file.js
const divideFunction = "function divide(a, b) {\\n  if (b === 0) {\\n    throw new Error(\\"Division by zero\\");\\n  }\\n  var result = a / b;\\n  return result;\\n}";

const fixedFunction = fixBugs(divideFunction);
console.log(fixedFunction);
      `,
      expectedOutput: `function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  let result = a / b;
  return result;
}
`,
      language: "javascript"
    }
  ]
};

/**
 * SWE-bench benchmark for SPARC2
 * Tests more complex software engineering tasks
 */
export const sparc2SWEBenchmark: BenchmarkConfig = {
  type: "swebench",
  name: "sparc2-code-refactoring",
  description: "Tests SPARC2's ability to refactor and improve code",
  testCases: [
    {
      id: "code-refactoring",
      input: `
// Function to refactor the divide function
function refactorDivideFunction(functionCode) {
  // Improve error message
  functionCode = functionCode.replace(
    'throw new Error("Division by zero")',
    'throw new Error("Cannot divide by zero")'
  );
  
  // Use const instead of var/let
  functionCode = functionCode.replace(/var |let /g, "const ");
  
  // Add input validation
  const improvedFunction = functionCode.replace(
    "function divide(a, b) {",
    "function divide(a, b) {\\n  if (typeof a !== 'number' || typeof b !== 'number') {\\n    throw new TypeError('Both arguments must be numbers');\\n  }"
  );
  
  return improvedFunction;
}

// Test with the divide function
const divideFunction = "function divide(a, b) {\\n  if (b === 0) {\\n    throw new Error(\\"Division by zero\\");\\n  }\\n  var result = a / b;\\n  return result;\\n}";

console.log(refactorDivideFunction(divideFunction));
      `,
      expectedOutput: `function divide(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new TypeError('Both arguments must be numbers');
  }
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  const result = a / b;
  return result;
}
`,
      language: "javascript"
    }
  ]
};

/**
 * RedCode benchmark for SPARC2
 * Tests security and safety aspects
 */
export const sparc2RedCodeBenchmark: BenchmarkConfig = {
  type: "redcode",
  name: "sparc2-security-analysis",
  description: "Tests SPARC2's ability to identify and fix security issues",
  testCases: [
    {
      id: "security-check",
      input: `
// Function to check for security issues
function checkSecurity(code) {
  const issues = [];
  
  // Check for eval usage
  if (code.includes("eval(")) {
    issues.push("Security issue: eval() usage detected");
  }
  
  // Check for innerHTML
  if (code.includes("innerHTML")) {
    issues.push("Potential XSS vulnerability: innerHTML usage detected");
  }
  
  return issues.length > 0 ? issues.join("\\n") : "No security issues detected";
}

// Test with a secure function
const secureCode = \`
function add(a, b) {
  return a + b;
}
\`;

console.log(checkSecurity(secureCode));
      `,
      expectedOutput: "No security issues detected",
      language: "javascript"
    }
  ]
};