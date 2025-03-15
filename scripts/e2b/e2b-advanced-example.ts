/**
 * E2B Code Interpreter Advanced Example
 * 
 * This script demonstrates more advanced features of the E2B Code Interpreter API
 * including file operations, package installation, and multi-language support.
 */

// Import the Sandbox class from E2B
import { Sandbox } from "npm:@e2b/code-interpreter";

// Main function to run the example
async function main() {
  try {
    // Get API key from environment variable
    const apiKey = Deno.env.get("E2B_API_KEY");
    if (!apiKey) {
      console.error("E2B_API_KEY environment variable is required");
      Deno.exit(1);
    }

    console.log("Creating code interpreter sandbox...");
    
    // Create a new sandbox instance using the factory method
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const sandbox = await Sandbox.create({ apiKey });
    console.log("Sandbox created successfully");

    // ===== File Operations Using Python =====
    console.log("\n===== File Operations Using Python =====");
    
    // Write a file using Python
    console.log("\nWriting file using Python...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const writeResult = await sandbox.runCode(`
# Write a file
with open('/tmp/data.txt', 'w') as f:
    f.write('Hello, E2B!\\nThis is a test file.')
print('File written successfully')
    `);
    console.log("Output:", writeResult.logs.stdout[0]);
    
    // Read the file using Python
    console.log("\nReading file using Python...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const readResult = await sandbox.runCode(`
# Read the file
with open('/tmp/data.txt', 'r') as f:
    content = f.read()
print('File content:', content)
    `);
    console.log("Output:", readResult.logs.stdout[0]);
    
    // List files using Python
    console.log("\nListing files using Python...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const listResult = await sandbox.runCode(`
# List files in directory
import os
files = os.listdir('/tmp')
print('Files in /tmp:', files)
    `);
    console.log("Output:", listResult.logs.stdout[0]);

    // ===== Package Installation =====
    console.log("\n===== Package Installation =====");
    
    // Install Python packages
    console.log("\nInstalling Python packages...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const installResult = await sandbox.runCode(`
!pip install numpy pandas matplotlib
print('Packages installed successfully')
    `);
    console.log("Output:", installResult.logs.stdout.join("\n"));

    // ===== Python Code Execution =====
    console.log("\n===== Python Code Execution =====");
    
    // Execute Python code with the installed packages
    console.log("\nExecuting Python code with installed packages...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const pythonResult = await sandbox.runCode(`
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

# Create a simple DataFrame
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'David'],
    'Age': [25, 30, 35, 40],
    'Score': [85, 92, 78, 95]
}
df = pd.DataFrame(data)

# Perform some calculations
mean_age = df['Age'].mean()
max_score = df['Score'].max()

# Print results
print("DataFrame:")
print(df)
print("\\nMean age:", mean_age)
print("Max score:", max_score)

# Return a result
"Python execution completed successfully"
    `);
    
    console.log("\nPython execution result:");
    console.log("Output:");
    pythonResult.logs.stdout.forEach(line => console.log("  " + line));
    console.log("Return value:", pythonResult.text);

    // ===== JavaScript Code Execution =====
    console.log("\n===== JavaScript Code Execution =====");
    
    // Execute JavaScript code
    console.log("\nExecuting JavaScript code...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const jsResult = await sandbox.runCode(`
// Create an array of objects
const people = [
  { name: 'Alice', age: 25, score: 85 },
  { name: 'Bob', age: 30, score: 92 },
  { name: 'Charlie', age: 35, score: 78 },
  { name: 'David', age: 40, score: 95 }
];

// Perform some calculations
const meanAge = people.reduce((sum, person) => sum + person.age, 0) / people.length;
const maxScore = Math.max(...people.map(person => person.score));

// Print results
console.log("People array:");
console.table(people);
console.log("\\nMean age:", meanAge);
console.log("Max score:", maxScore);

// Return a result
"JavaScript execution completed successfully"
    `, { language: "javascript" });
    
    console.log("\nJavaScript execution result:");
    console.log("Output:");
    jsResult.logs.stdout.forEach(line => console.log("  " + line));
    console.log("Return value:", jsResult.text);

    // ===== File Manipulation with Code =====
    console.log("\n===== File Manipulation with Code =====");
    
    // Create a CSV file using Python
    console.log("\nCreating CSV file using Python...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const csvResult = await sandbox.runCode(`
import pandas as pd

# Create a DataFrame
data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'David'],
    'Age': [25, 30, 35, 40],
    'Score': [85, 92, 78, 95]
}
df = pd.DataFrame(data)

# Save to CSV
df.to_csv('/tmp/data.csv', index=False)
print("CSV file created successfully")

# Read the CSV file to show content
with open('/tmp/data.csv', 'r') as f:
    content = f.read()
print("CSV content:")
print(content)
    `);
    
    console.log("Output:");
    csvResult.logs.stdout.forEach(line => console.log("  " + line));

    // Close the sandbox
    console.log("\nClosing sandbox...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    await sandbox.kill();
    
    console.log("Advanced example completed successfully!");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the example
if (import.meta.main) {
  main();
}