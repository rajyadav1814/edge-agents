/**
 * E2B JavaScript Code Execution Example
 * 
 * This example demonstrates how to execute JavaScript code using the E2B Code Interpreter
 * in the SPARC2 framework.
 */

import { executeCode } from "../../src/sandbox/codeInterpreter.ts";

/**
 * Main function to run the example
 */
async function main() {
  console.log("===== E2B JavaScript Code Execution Example =====");

  // Simple JavaScript code example
  const jsCode = `
// Define a class for a simple data structure
class BinarySearchTree {
  constructor() {
    this.root = null;
  }
  
  // Node class for the tree
  static Node = class {
    constructor(value) {
      this.value = value;
      this.left = null;
      this.right = null;
    }
  };
  
  // Insert a value into the tree
  insert(value) {
    const newNode = new BinarySearchTree.Node(value);
    
    if (this.root === null) {
      this.root = newNode;
      return;
    }
    
    const insertNode = (node, newNode) => {
      if (newNode.value < node.value) {
        if (node.left === null) {
          node.left = newNode;
        } else {
          insertNode(node.left, newNode);
        }
      } else {
        if (node.right === null) {
          node.right = newNode;
        } else {
          insertNode(node.right, newNode);
        }
      }
    };
    
    insertNode(this.root, newNode);
  }
  
  // In-order traversal
  inOrderTraversal(callback) {
    const traverse = (node, callback) => {
      if (node !== null) {
        traverse(node.left, callback);
        callback(node.value);
        traverse(node.right, callback);
      }
    };
    
    traverse(this.root, callback);
  }
}

// Create a new BST and insert some values
const bst = new BinarySearchTree();
const values = [10, 5, 15, 3, 7, 12, 18];

console.log("Inserting values:", values.join(", "));
values.forEach(value => bst.insert(value));

// Traverse the tree and print values
console.log("\\nIn-order traversal:");
const result = [];
bst.inOrderTraversal(value => result.push(value));
console.log(result.join(", "));

// Demonstrate some JavaScript built-in functions
console.log("\\nUsing JavaScript built-in functions:");
const numbers = [1, 2, 3, 4, 5];
console.log("Original array:", numbers);
console.log("Map:", numbers.map(n => n * 2));
console.log("Filter:", numbers.filter(n => n % 2 === 0));
console.log("Reduce:", numbers.reduce((acc, n) => acc + n, 0));

// Use some ES6+ features
console.log("\\nUsing ES6+ features:");
const [first, second, ...rest] = numbers;
console.log("Destructuring:", { first, second, rest });

const person = { name: "John", age: 30 };
const extendedPerson = { ...person, job: "Developer" };
console.log("Spread operator:", extendedPerson);

// Async/await example
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function asyncExample() {
  console.log("\\nAsync/await example:");
  console.log("Start");
  await delay(100);
  console.log("After delay");
  return "Done";
}

asyncExample().then(result => console.log("Result:", result));
`;

  try {
    console.log("Executing JavaScript code...");
    const result = await executeCode(jsCode, { language: "javascript" });
    
    if (result.error) {
      console.error("Error executing JavaScript code:", result.error);
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