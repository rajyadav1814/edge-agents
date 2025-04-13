/**
 * GitHub Projects MCP Server
 * 
 * This is the main entry point for the GitHub Projects MCP server.
 * It initializes the configuration, services, and tools, and starts the server.
 */

// Import configuration
const { config, validateConfig } = require('./config');

// Import server
const { createServer, startServer } = require('./server');

// Import services
const { initializeServices } = require('./services');

// Import tools
const { registerTools } = require('./tools');

/**
 * Main function to start the MCP server
 */
async function main() {
  try {
    // Validate configuration
    validateConfig();
    
    // Create MCP server
    const server = createServer();
    
    // Initialize services
    const services = initializeServices(config);
    
    // Register tools
    registerTools(server, services, config);
    
    // Start server
    await startServer(server, config);
  } catch (error) {
    console.error('Error starting GitHub Projects MCP server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch(console.error);