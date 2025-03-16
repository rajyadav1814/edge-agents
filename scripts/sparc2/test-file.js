function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// This function has a bug
function multiply(a, b) {
  return a * b;
}

// This function could be improved
function divide(a, b) {
  // Guard clause for division by zero
  if (b === 0) throw new Error("Division by zero");
  
  // Use modern arrow function and implicit return
  const performDivision = (numerator, denominator) => numerator / denominator;
  
  return performDivision(a, b);
}
