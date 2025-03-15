/**
 * Code Modification Example
 * Demonstrates how to use the SPARC2 agent to modify code
 */

import { SPARC2Agent } from "../src/agent/sparc2-agent.ts";

// Sample code to modify
const sampleCode = `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total;
}

// TODO: Add tax calculation
function displayTotal(items) {
  const total = calculateTotal(items);
  console.log("Total: $" + total);
}

const items = [
  { name: "Item 1", price: 10 },
  { name: "Item 2", price: 20 },
  { name: "Item 3", price: 30 }
];

displayTotal(items);
`;

// Suggestions for modifications
const suggestions = `
Here are some suggested improvements for the code:

1. Add type annotations to make the code more robust
2. Implement the tax calculation functionality
3. Use array reduce method instead of a for loop for better readability
4. Use template literals instead of string concatenation
5. Add proper error handling for missing or invalid prices
`;

/**
 * Main function
 */
async function main() {
  try {
    console.log("Initializing SPARC2 agent...");
    
    // Create and initialize the agent
    const agent = new SPARC2Agent({
      configPath: "config/agent-config.toml"
    });
    
    await agent.initialize();
    
    console.log("Modifying code based on suggestions...");
    
    // Apply the suggested modifications
    const results = await agent.applyChanges([
      {
        path: "example.js",
        content: sampleCode,
        originalContent: sampleCode
      }
    ], suggestions);
    
    // Display the results
    for (const result of results) {
      if (result.success) {
        console.log(`\nModified ${result.path}:`);
        console.log(result.modifiedContent);
        
        console.log("\nDiff:");
        console.log(result.diff);
      } else {
        console.error(`\nFailed to modify ${result.path}: ${result.error}`);
      }
    }
    
    console.log("\nDone!");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
  }
}

// Run the example
main();