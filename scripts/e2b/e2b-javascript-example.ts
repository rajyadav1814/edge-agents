/**
 * E2B JavaScript Example
 * 
 * This script demonstrates how to execute JavaScript code
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

    // ===== Basic JavaScript Execution =====
    console.log("\n===== Basic JavaScript Execution =====");
    
    // Execute simple JavaScript code
    console.log("\nExecuting simple JavaScript code...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const basicResult = await sandbox.runCode(`
// Define a simple function
function greet(name) {
  return \`Hello, \${name}!\`;
}

// Call the function
const greeting = greet('E2B');
console.log(greeting);

// Return a value
greeting;
    `, { language: "javascript" });
    
    console.log("Output:");
    basicResult.logs.stdout.forEach(line => console.log(`  ${line}`));
    console.log("Return value:", basicResult.text);

    // ===== JavaScript Data Manipulation =====
    console.log("\n===== JavaScript Data Manipulation =====");
    
    // Execute JavaScript code with data manipulation
    console.log("\nExecuting JavaScript code with data manipulation...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const dataResult = await sandbox.runCode(`
// Sample data
const users = [
  { id: 1, name: 'Alice', age: 25, active: true },
  { id: 2, name: 'Bob', age: 30, active: false },
  { id: 3, name: 'Charlie', age: 35, active: true },
  { id: 4, name: 'David', age: 40, active: false },
  { id: 5, name: 'Eve', age: 45, active: true }
];

// Filter active users
const activeUsers = users.filter(user => user.active);
console.log('Active users:', activeUsers);

// Map to get names
const names = users.map(user => user.name);
console.log('User names:', names);

// Calculate average age
const totalAge = users.reduce((sum, user) => sum + user.age, 0);
const averageAge = totalAge / users.length;
console.log('Average age:', averageAge);

// Find user by id
const findUserById = (id) => users.find(user => user.id === id);
console.log('User with id 3:', findUserById(3));

// Sort users by age (descending)
const sortedByAge = [...users].sort((a, b) => b.age - a.age);
console.log('Users sorted by age (descending):', sortedByAge);

// Group users by active status
const groupedByActive = users.reduce((groups, user) => {
  const key = user.active ? 'active' : 'inactive';
  if (!groups[key]) {
    groups[key] = [];
  }
  groups[key].push(user);
  return groups;
}, {});
console.log('Users grouped by active status:', groupedByActive);

// Return a summary
return {
  totalUsers: users.length,
  activeUsers: activeUsers.length,
  averageAge,
  names
};
    `, { language: "javascript" });
    
    console.log("Output:");
    dataResult.logs.stdout.forEach(line => console.log(`  ${line}`));
    console.log("Return value:", dataResult.text);

    // ===== JavaScript File Operations =====
    console.log("\n===== JavaScript File Operations =====");
    
    // Write a file using JavaScript
    console.log("\nWriting file using JavaScript...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const writeFileResult = await sandbox.runCode(`
// Import the fs module
const fs = require('fs');

// Data to write
const data = {
  name: 'E2B Example',
  description: 'JavaScript file operations example',
  timestamp: new Date().toISOString(),
  items: [1, 2, 3, 4, 5]
};

// Write to a file
fs.writeFileSync('/tmp/data.json', JSON.stringify(data, null, 2));
console.log('File written successfully');

// Verify the file exists
const exists = fs.existsSync('/tmp/data.json');
console.log('File exists:', exists);

// Return success
return { success: true, path: '/tmp/data.json' };
    `, { language: "javascript" });
    
    console.log("Output:");
    writeFileResult.logs.stdout.forEach(line => console.log(`  ${line}`));
    console.log("Return value:", writeFileResult.text);

    // Read the file using JavaScript
    console.log("\nReading file using JavaScript...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const readFileResult = await sandbox.runCode(`
// Import the fs module
const fs = require('fs');

// Read the file
const content = fs.readFileSync('/tmp/data.json', 'utf8');
const data = JSON.parse(content);
console.log('File content:', data);

// Return the parsed data
return data;
    `, { language: "javascript" });
    
    console.log("Output:");
    readFileResult.logs.stdout.forEach(line => console.log(`  ${line}`));
    console.log("Return value:", readFileResult.text);

    // ===== JavaScript Package Installation =====
    console.log("\n===== JavaScript Package Installation =====");
    
    // Install a JavaScript package
    console.log("\nInstalling JavaScript package...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const installResult = await sandbox.runCode(`
!npm install lodash
console.log('Lodash installed successfully');
    `, { language: "javascript" });
    
    console.log("Output:");
    installResult.logs.stdout.forEach(line => console.log(`  ${line}`));

    // Use the installed package
    console.log("\nUsing installed JavaScript package...");
    // @ts-ignore - Ignore TypeScript errors for API compatibility
    const packageResult = await sandbox.runCode(`
// Import lodash
const _ = require('lodash');

// Sample data
const users = [
  { id: 1, name: 'Alice', age: 25, active: true },
  { id: 2, name: 'Bob', age: 30, active: false },
  { id: 3, name: 'Charlie', age: 35, active: true },
  { id: 4, name: 'David', age: 40, active: false },
  { id: 5, name: 'Eve', age: 45, active: true }
];

// Use lodash functions
const chunkedUsers = _.chunk(users, 2);
console.log('Chunked users:', chunkedUsers);

const groupedUsers = _.groupBy(users, 'active');
console.log('Grouped users:', groupedUsers);

const sortedUsers = _.sortBy(users, ['active', 'age']);
console.log('Sorted users:', sortedUsers);

const firstActiveUser = _.find(users, { active: true });
console.log('First active user:', firstActiveUser);

const sumOfAges = _.sumBy(users, 'age');
console.log('Sum of ages:', sumOfAges);

// Return a summary
return {
  usingLodash: true,
  functions: ['chunk', 'groupBy', 'sortBy', 'find', 'sumBy'],
  sumOfAges
};
    `, { language: "javascript" });
    
    console.log("Output:");
    packageResult.logs.stdout.forEach(line => console.log(`  ${line}`));
    console.log("Return value:", packageResult.text);

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