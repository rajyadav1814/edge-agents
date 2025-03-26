// Function to multiply two numbers with input validation
function multiply(a, b) {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Both arguments must be numbers');
  }
  return a * b; // Returns the product of a and b
}

// Test the function with an assertion
console.assert(multiply(5, 3) === 15, 'Test failed: multiply(5, 3) should return 15');