const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Source files to copy
const sourceFiles = [
  'simple-mcp-server.js',
  'mcp-stdio-server.js',
  'run-simple-mcp.sh',
  'run-stdio-mcp.sh'
];

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Create .well-known directory in dist if it doesn't exist
const wellKnownDir = path.join(distDir, '.well-known');
if (!fs.existsSync(wellKnownDir)) {
  fs.mkdirSync(wellKnownDir);
}

// Copy source files to dist
sourceFiles.forEach(file => {
  const sourcePath = path.join(__dirname, file);
  const destPath = path.join(distDir, file);
  
  console.log(`Copying ${sourcePath} to ${destPath}...`);
  
  try {
    fs.copyFileSync(sourcePath, destPath);
    
    // Make shell scripts executable
    if (file.endsWith('.sh')) {
      fs.chmodSync(destPath, '755');
    }
    
    console.log(`Successfully built ${destPath}`);
  } catch (error) {
    console.error(`Error building ${file}:`, error);
    process.exit(1);
  }
});

// Copy MCP discovery file
const mcpDiscoverySource = path.join(__dirname, '.well-known', 'mcp.json');
const mcpDiscoveryDest = path.join(wellKnownDir, 'mcp.json');

console.log(`Copying ${mcpDiscoverySource} to ${mcpDiscoveryDest}...`);

try {
  fs.copyFileSync(mcpDiscoverySource, mcpDiscoveryDest);
  console.log(`Successfully copied MCP discovery file to ${mcpDiscoveryDest}`);
} catch (error) {
  console.error(`Error copying MCP discovery file:`, error);
  process.exit(1);
}

// Create combined run script
const combinedRunScript = `#!/bin/bash
# Combined script to run both MCP servers

# Start the HTTP server in the background
./run-simple-mcp.sh &
HTTP_PID=$!

# Start the stdio server in the background
./run-stdio-mcp.sh &
STDIO_PID=$!

# Function to handle exit
function cleanup {
  echo "Shutting down servers..."
  kill $HTTP_PID $STDIO_PID 2>/dev/null
  exit 0
}

# Set up trap for clean exit
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $HTTP_PID $STDIO_PID
`;

const combinedRunPath = path.join(distDir, 'run-mcp-servers.sh');
fs.writeFileSync(combinedRunPath, combinedRunScript);
fs.chmodSync(combinedRunPath, '755');
console.log('Successfully created combined run script');

console.log('Build completed successfully!');
console.log(`Output files are in: ${distDir}`);