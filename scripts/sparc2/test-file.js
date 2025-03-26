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
    throw new Error("Cannot divide by zero.");
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

/**
 * Calculates the remainder of the division of two numbers.
 * @param {number} a - The dividend
 * @param {number} b - The divisor
 * @returns {number} The remainder of a divided by b
 * @throws {Error} If b is zero
 */
function modulo(a, b) {
  if (b === 0) {
    throw new Error("Cannot divide by zero.");
  }
  return a % b;
}

// Test cases
function runTests() {
  // Test addition
  console.log("Testing add: 5 + 3 =", add(5, 3));
  console.log("Testing add with zero: 5 + 0 =", add(5, 0));
  console.log("Testing add with negatives: -5 + 3 =", add(-5, 3));

  // Test subtraction
  console.log("Testing subtract: 10 - 4 =", subtract(10, 4));
  console.log("Testing subtract with zero: 10 - 0 =", subtract(10, 0));
  console.log("Testing subtract with negatives: -10 - 4 =", subtract(-10, 4));

  // Test multiplication
  console.log("Testing multiply: 6 * 7 =", multiply(6, 7));
  console.log("Testing multiply with zero: 6 * 0 =", multiply(6, 0));
  console.log("Testing multiply with negatives: -6 * 7 =", multiply(-6, 7));

  // Test division
  console.log("Testing divide: 20 / 5 =", divide(20, 5));
  console.log("Testing divide with negatives: -20 / 5 =", divide(-20, 5));

  // Test power
  console.log("Testing power: 2 ** 3 =", power(2, 3));
  console.log("Testing power with zero exponent: 2 ** 0 =", power(2, 0));
  console.log("Testing power with negative exponent: 2 ** -2 =", power(2, -2));

  // Test modulo
  console.log("Testing modulo: 20 % 3 =", modulo(20, 3));
  console.log("Testing modulo with negatives: -20 % 3 =", modulo(-20, 3));
  console.log("Testing modulo with zero divisor (should catch error):");
  try {
    console.log("Testing modulo by zero:", modulo(10, 0));
  } catch (error) {
    console.log("Error caught:", error.message);
  }

  // Test error handling for division by zero
  try {
    console.log("Testing divide by zero:", divide(10, 0));
  } catch (error) {
    console.log("Error caught:", error.message);
  }
}

runTests();