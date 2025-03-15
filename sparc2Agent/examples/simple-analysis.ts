/**
 * Simple Analysis Example
 * Demonstrates how to use the SPARC2 agent to analyze code
 */

import { SPARC2Agent } from "../src/agent/sparc2-agent.ts";

// Sample code to analyze
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
    
    console.log("Analyzing code...");
    
    // Analyze the code
    const analysis = await agent.analyzeChanges([
      {
        path: "example.js",
        content: sampleCode,
        originalContent: sampleCode
      }
    ]);
    
    console.log("\nAnalysis Results:");
    console.log(analysis);
    
    console.log("\nDone!");
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error:", errorMessage);
  }
}

// Run the example
main();