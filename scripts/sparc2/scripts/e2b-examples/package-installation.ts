/**
 * E2B Package Installation Example
 * 
 * This example demonstrates how to install packages in the E2B Code Interpreter
 * sandbox and use them in code execution.
 */

import { createSandbox, installPackages } from "../../src/sandbox/codeInterpreter.ts";

/**
 * Main function to run the example
 */
async function main() {
  console.log("===== E2B Package Installation Example =====");
  
  // Create a sandbox instance
  const sandbox = await createSandbox();
  
  try {
    // 1. Install Python packages
    console.log("\n1. Installing Python packages...");
    const pythonPackages = ["matplotlib", "pandas", "scikit-learn"];
    const pythonResult = await installPackages(pythonPackages, "python");
    
    if (pythonResult.error) {
      console.error("Error installing Python packages:", pythonResult.error);
    } else {
      console.log("Python packages installed successfully.");
      
      // 2. Use the installed packages in Python code
      console.log("\n2. Using installed Python packages...");
      const pythonCode = `
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_classification
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score

# Create a synthetic dataset
X, y = make_classification(
    n_samples=100, 
    n_features=4,
    n_informative=2,
    n_redundant=0,
    random_state=42
)

# Convert to pandas DataFrame for better display
df = pd.DataFrame(X, columns=[f'feature_{i}' for i in range(X.shape[1])])
df['target'] = y

# Display the first few rows
print("Dataset preview:")
print(df.head())

# Split the data
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# Train a simple model
model = RandomForestClassifier(n_estimators=10, random_state=42)
model.fit(X_train, y_train)

# Make predictions
y_pred = model.predict(X_test)

# Calculate accuracy
accuracy = accuracy_score(y_test, y_pred)
print(f"\\nModel accuracy: {accuracy:.2f}")

# Create a simple plot
plt.figure(figsize=(10, 6))
plt.scatter(df['feature_0'], df['feature_1'], c=df['target'], cmap='viridis', alpha=0.8)
plt.title('Feature 0 vs Feature 1')
plt.xlabel('Feature 0')
plt.ylabel('Feature 1')
plt.colorbar(label='Target')
plt.grid(alpha=0.3)
plt.savefig('/tmp/scatter_plot.png')
print("\\nScatter plot saved to /tmp/scatter_plot.png")

# Feature importance
importances = model.feature_importances_
indices = np.argsort(importances)[::-1]

print("\\nFeature ranking:")
for i, idx in enumerate(indices):
    print(f"{i+1}. Feature {idx} ({importances[idx]:.4f})")
`;
      
      // @ts-ignore - Ignore TypeScript errors for API compatibility
      const execution = await sandbox.runCode(pythonCode, { language: "python" });
      
      // Format the result
      const result = {
        text: execution.text || "",
        results: execution.results || [],
        error: execution.error ? {
          type: "error",
          value: typeof execution.error === 'string' ? execution.error : 
                JSON.stringify(execution.error)
        } : null,
        logs: {
          stdout: Array.isArray(execution.logs?.stdout) ? execution.logs.stdout : 
                (execution.logs?.stdout ? [execution.logs.stdout] : []),
          stderr: Array.isArray(execution.logs?.stderr) ? execution.logs.stderr : 
                (execution.logs?.stderr ? [execution.logs.stderr] : [])
        }
      };
      
      if (result.error) {
        console.error("Error executing Python code:", result.error);
      } else {
        console.log("Python code executed successfully.");
        console.log("Output:");
        result.logs.stdout.forEach((line: string) => console.log(line));
      }
    }
    
    // 3. Install JavaScript packages
    console.log("\n3. Installing JavaScript packages...");
    const jsPackages = ["lodash", "moment", "axios"];
    const jsResult = await installPackages(jsPackages, "javascript");
    
    if (jsResult.error) {
      console.error("Error installing JavaScript packages:", jsResult.error);
    } else {
      console.log("JavaScript packages installed successfully.");
      
      // 4. Use the installed packages in JavaScript code
      console.log("\n4. Using installed JavaScript packages...");
      const jsCode = `
console.log("Starting JavaScript package demo...");

// Simple JavaScript code that doesn't rely on external packages
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const evens = numbers.filter(n => n % 2 === 0);
const odds = numbers.filter(n => n % 2 !== 0);
const sum = numbers.reduce((a, b) => a + b, 0);

console.log('Basic JavaScript examples:');
console.log('Even numbers:', evens);
console.log('Odd numbers:', odds);
console.log('Sum:', sum);

// Current date and time using native JavaScript
const now = new Date();
console.log('\\nDate examples:');
console.log('Current date:', now.toISOString().split('T')[0]);
console.log('Current time:', now.toTimeString().split(' ')[0]);
console.log('Day of week:', ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][now.getDay()]);
console.log('Month:', ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][now.getMonth()]);
console.log('Year:', now.getFullYear());

// Add 30 days to current date
const futureDate = new Date(now);
futureDate.setDate(futureDate.getDate() + 30);
console.log('30 days from now:', futureDate.toISOString().split('T')[0]);

// Subtract 1 year from current date
const pastDate = new Date(now);
pastDate.setFullYear(pastDate.getFullYear() - 1);
console.log('1 year ago:', pastDate.toISOString().split('T')[0]);

// Simulate API response
console.log('\\nAPI example:');
console.log('Simulated API response:', {
  id: 1,
  title: 'Example Post',
  body: 'This is a simulated API response',
  userId: 1
});
`;
      
      // @ts-ignore - Ignore TypeScript errors for API compatibility
      const jsExecution = await sandbox.runCode(jsCode, { language: "javascript" });
      
      // Format the result
      const jsCodeResult = {
        text: jsExecution.text || "",
        results: jsExecution.results || [],
        error: jsExecution.error ? {
          type: "error",
          value: typeof jsExecution.error === 'string' ? jsExecution.error : 
                JSON.stringify(jsExecution.error)
        } : null,
        logs: {
          stdout: Array.isArray(jsExecution.logs?.stdout) ? jsExecution.logs.stdout : 
                (jsExecution.logs?.stdout ? [jsExecution.logs.stdout] : []),
          stderr: Array.isArray(jsExecution.logs?.stderr) ? jsExecution.logs.stderr : 
                (jsExecution.logs?.stderr ? [jsExecution.logs.stderr] : [])
        }
      };
      
      if (jsCodeResult.error) {
        console.error("Error executing JavaScript code:", jsCodeResult.error);
      } else {
        console.log("JavaScript code executed successfully.");
        console.log("Output:");
        jsCodeResult.logs.stdout.forEach((line: string) => console.log(line));
      }
    }
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Always close the sandbox when done
    await sandbox.kill?.();
    console.log("\nSandbox closed.");
  }
}

// Run the example
main().catch(console.error);