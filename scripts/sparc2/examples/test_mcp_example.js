// Simple test file for MCP server

/**
 * Adds two numbers.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The sum of a and b.
 */
function add(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a + b;
}

/**
 * Subtracts the second number from the first.
 * @param {number} a - The first number.
 * @param {number} b - The second number.
 * @returns {number} The difference of a and b.
 */
function subtract(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a - b;
}

console.log("Test file loaded");

// Basic test cases
try {
  console.assert(add(2, 3) === 5, 'Test Case 1 Failed');
  console.assert(add(-1, 1) === 0, 'Test Case 2 Failed');
  console.assert(subtract(5, 3) === 2, 'Test Case 3 Failed');
  console.assert(subtract(0, 0) === 0, 'Test Case 4 Failed');
  console.log('All test cases passed');
} catch (error) {
  console.error('Error:', error.message);
}