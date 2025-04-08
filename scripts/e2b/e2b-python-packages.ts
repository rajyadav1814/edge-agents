/**
 * E2B Python Packages Example
 * 
 * This script demonstrates how to install and use Python packages
 * in the E2B Code Interpreter sandbox.
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

    // ===== Package Installation =====
    console.log("\n===== Package Installation =====");
    
    // Install Python packages
    console.log("\nInstalling Python packages...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const installResult = await sandbox.runCode(`
!pip install numpy pandas matplotlib
print('Packages installed successfully')
    `);
    console.log("Output:");
    installResult.logs.stdout.forEach(line => console.log(`  ${line}`));

    // ===== Using Installed Packages =====
    console.log("\n===== Using Installed Packages =====");
    
    // Execute Python code with the installed packages
    console.log("\nExecuting Python code with installed packages...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const pythonResult = await sandbox.runCode(`
import numpy as np
import pandas as pd

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
min_score = df['Score'].min()
std_age = df['Age'].std()

# Create a numpy array and perform operations
arr = np.array([1, 2, 3, 4, 5])
arr_squared = arr ** 2
arr_mean = np.mean(arr)
arr_sum = np.sum(arr)

# Print results
print("DataFrame:")
print(df)
print("\\nStatistics:")
print(f"Mean age: {mean_age}")
print(f"Max score: {max_score}")
print(f"Min score: {min_score}")
print(f"Standard deviation of age: {std_age}")
print("\\nNumPy operations:")
print(f"Original array: {arr}")
print(f"Squared array: {arr_squared}")
print(f"Mean of array: {arr_mean}")
print(f"Sum of array: {arr_sum}")

# Return a result
"Python packages demonstration completed successfully"
    `);
    
    console.log("Output:");
    pythonResult.logs.stdout.forEach(line => console.log(`  ${line}`));
    console.log("Return value:", pythonResult.text);

    // ===== Data Visualization =====
    console.log("\n===== Data Visualization =====");
    
    // Create a simple plot using matplotlib
    console.log("\nCreating a plot using matplotlib...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const plotResult = await sandbox.runCode(`
import matplotlib.pyplot as plt
import numpy as np

# Create data
x = np.linspace(0, 10, 100)
y1 = np.sin(x)
y2 = np.cos(x)

# Create plot
plt.figure(figsize=(10, 6))
plt.plot(x, y1, label='sin(x)')
plt.plot(x, y2, label='cos(x)')
plt.title('Sine and Cosine Functions')
plt.xlabel('x')
plt.ylabel('y')
plt.legend()
plt.grid(True)

# Save the plot to a file
plt.savefig('/tmp/plot.png')
print('Plot saved to /tmp/plot.png')

# Verify the file exists
import os
if os.path.exists('/tmp/plot.png'):
    print('File verification: Plot file exists')
    print(f'File size: {os.path.getsize("/tmp/plot.png")} bytes')
else:
    print('File verification: Plot file does not exist')
    `);
    
    console.log("Output:");
    plotResult.logs.stdout.forEach(line => console.log(`  ${line}`));

    // Close the sandbox
    console.log("\nClosing sandbox...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    await sandbox.kill();
    
    console.log("Example completed successfully!");
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// Run the example
if (import.meta.main) {
  main();
}