
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
