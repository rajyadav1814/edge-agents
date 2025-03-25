// Arithmetic operations

/**
 * Adds two numbers.
 * @param {number} a - The first number
 * @param {number} b - The second number
 * @returns {number} The sum of a and b
 */
function add(a, b) {
  return a + b;
}

/**
 * Subtracts the second number from the first.
 * @param {number} a - The first number
 * @param {number} b - The second number
 * @returns {number} The difference of a and b
 */
function subtract(a, b) {
  return a - b;
}

/**
 * Multiplies two numbers.
 * @param {number} a - The first number
 * @param {number} b - The second number
 * @returns {number} The product of a and b
 */
function multiply(a, b) {
  return a * b;
}

/**
 * Divides the first number by the second.
 * @param {number} a - The numerator
 * @param {number} b - The denominator
 * @returns {number} The quotient of a and b
 * @throws {Error} If b is zero
 */
function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero is not allowed");
  }
  return a / b;
}

/**
 * Calculates the power of a number.
 * @param {number} base - The base number
 * @param {number} exponent - The exponent
 * @returns {number} The result of base raised to the power of exponent
 */
function power(base, exponent) {
  return base ** exponent; // Using the exponentiation operator
}

// Test cases
function runTests() {
  console.log("Testing add: 5 + 3 =", add(5, 3));
  console.log("Testing subtract: 10 - 4 =", subtract(10, 4));
  console.log("Testing multiply: 6 * 7 =", multiply(6, 7));
  console.log("Testing divide: 20 / 5 =", divide(20, 5));

  // Test error handling
  try {
    console.log("Testing divide by zero:", divide(10, 0));
  } catch (error) {
    console.log("Error caught:", error.message);
  }
}

runTests();