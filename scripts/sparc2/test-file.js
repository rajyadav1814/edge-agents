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
    throw new Error(`Division by zero is undefined. Inputs were: a=${a}, b=${b}`);
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
    throw new Error(`Modulo by zero is undefined. Inputs were: a=${a}, b=${b}`);
  }
  return a % b;
}

// Test cases
function runTests() {
  const tests = [
    { func: add, desc: "add", cases: [[5, 3, 8], [5, 0, 5], [-5, 3, -2], [1e10, 1e10, 2e10], [0.1, 0.2, 0.3, true]] },
    { func: subtract, desc: "subtract", cases: [[10, 4, 6], [10, 0, 10], [-10, 4, -14], [0.1, 0.2, -0.1, true]] },
    { func: multiply, desc: "multiply", cases: [[6, 7, 42], [6, 0, 0], [-6, 7, -42], [1e5, 1e5, 1e10]] },
    { func: divide, desc: "divide", cases: [[20, 5, 4], [-20, 5, -4], [0.1, 0.2, 0.5]] },
    { func: power, desc: "power", cases: [[2, 3, 8], [2, 0, 1], [2, -2, 0.25], [2, 10, 1024]] },
    { func: modulo, desc: "modulo", cases: [[20, 3, 2], [-20, 3, -2]] }
  ];

  tests.forEach(test => {
    test.cases.forEach(([a, b, expected, isApproximate = false]) => {
      runTest(test.desc, a, b, test.func(a, b), expected, isApproximate);
    });
  });

  console.log("Testing divide by zero (should catch error):");
  testErrorHandling(() => divide(10, 0));

  console.log("Testing modulo with zero divisor (should catch error):");
  testErrorHandling(() => modulo(10, 0));
}

function runTest(description, a, b, result, expected, isApproximate = false) {
  const pass = isApproximate ? Math.abs(result - expected) < 1e-10 : result === expected;
  console.log(`Test: ${description} | Inputs: (${a}, ${b}) | Result: ${result} | Expected: ${expected} | ${pass ? "PASS" : "FAIL"}`);
}

function testErrorHandling(testFunction) {
  try {
    testFunction();
  } catch (error) {
    console.log("Error caught:", error.message);
  }
}

runTests();