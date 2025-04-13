/**
 * Command Executor Utility
 * 
 * This utility provides a function to execute shell commands
 * with proper error handling and output capture.
 */

const { exec } = require('child_process');
const util = require('util');

// Promisify exec for async/await usage
const execPromise = util.promisify(exec);

/**
 * Execute a shell command and return the output
 * @param {string} command - The command to execute
 * @returns {Promise<string>} - Command output
 */
async function executeCommand(command) {
  try {
    console.log(`Executing command: ${command}`);
    const { stdout, stderr } = await execPromise(command);
    
    if (stderr) {
      console.warn(`Command stderr: ${stderr}`);
    }
    
    return stdout.trim();
  } catch (error) {
    console.error(`Command execution error: ${error.message}`);
    
    // Include stdout and stderr in the error object for better debugging
    if (error.stdout) {
      error.stdout = error.stdout.trim();
    }
    if (error.stderr) {
      error.stderr = error.stderr.trim();
    }
    
    throw error;
  }
}

module.exports = { executeCommand };