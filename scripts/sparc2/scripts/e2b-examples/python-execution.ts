/**
 * E2B Python Code Execution Example
 * 
 * This example demonstrates how to execute Python code using the E2B Code Interpreter
 * in the SPARC2 framework.
 */

import { executeCode } from "../../src/sandbox/codeInterpreter.ts";

/**
 * Main function to run the example
 */
async function main() {
  console.log("===== E2B Python Code Execution Example =====");

  // Simple Python code example
  const pythonCode = `
import math

def calculate_circle_area(radius):
    """Calculate the area of a circle with the given radius."""
    return math.pi * radius ** 2

# Test the function with different radii
radii = [1, 2, 5, 10]
for radius in radii:
    area = calculate_circle_area(radius)
    print(f"Circle with radius {radius} has area {area:.2f}")

# Use some more advanced Python features
import numpy as np

# Create a simple array
arr = np.array([1, 2, 3, 4, 5])
print(f"\\nNumPy array: {arr}")
print(f"Mean: {np.mean(arr)}")
print(f"Sum: {np.sum(arr)}")
print(f"Standard deviation: {np.std(arr)}")

# Create a 2D array
matrix = np.array([[1, 2, 3], [4, 5, 6], [7, 8, 9]])
print(f"\\n2D Matrix:\\n{matrix}")
print(f"Matrix transpose:\\n{matrix.T}")
print(f"Matrix determinant: {np.linalg.det(matrix)}")
`;

  try {
    console.log("Executing Python code...");
    const result = await executeCode(pythonCode, { language: "python" });
    
    if (result.error) {
      console.error("Error executing Python code:", result.error);
    } else {
      console.log("\nExecution successful!");
      console.log("Output:");
      result.logs.stdout.forEach((line: string) => console.log(line));
    }
  } catch (error) {
    console.error("Exception occurred:", error);
  }
}

// Run the example
main().catch(console.error);