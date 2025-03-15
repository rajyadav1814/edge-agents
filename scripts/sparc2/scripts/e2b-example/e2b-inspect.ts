/**
 * E2B Code Interpreter Inspection
 * 
 * This script inspects the structure of the E2B Code Interpreter SDK
 * to understand its API.
 */

// Import the E2B SDK
import CodeInterpreter from "npm:@e2b/code-interpreter";

// Log the structure of the imported module
console.log("CodeInterpreter type:", typeof CodeInterpreter);
console.log("CodeInterpreter properties:", Object.getOwnPropertyNames(CodeInterpreter));
console.log("CodeInterpreter prototype:", Object.getOwnPropertyNames(Object.getPrototypeOf(CodeInterpreter)));

// If CodeInterpreter is a class, try to instantiate it
if (typeof CodeInterpreter === 'function') {
  try {
    console.log("Attempting to instantiate CodeInterpreter...");
    const instance = new CodeInterpreter({ apiKey: "test_key" });
    console.log("Instance created:", instance);
    console.log("Instance properties:", Object.getOwnPropertyNames(instance));
    console.log("Instance methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(instance)));
  } catch (error) {
    console.error("Error instantiating CodeInterpreter:", error);
  }
}

// Check if there's a static create method
if (typeof CodeInterpreter === 'function' && 'create' in CodeInterpreter) {
  console.log("CodeInterpreter has a static create method");
} else {
  console.log("CodeInterpreter does not have a static create method");
}

// Log all exported members
console.log("All exports from module:", Object.keys(CodeInterpreter));