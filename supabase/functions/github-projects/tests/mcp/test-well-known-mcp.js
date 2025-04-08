// Test script for .well-known/mcp.json endpoint
const http = require('http');

const MCP_URL = 'http://localhost:8002';

console.log(`Testing .well-known/mcp.json endpoint at ${MCP_URL}/.well-known/mcp.json`);

// Make a request to the .well-known/mcp.json endpoint
http.get(`${MCP_URL}/.well-known/mcp.json`, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  let data = '';
  
  // Collect response data
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Process the complete response
  res.on('end', () => {
    try {
      const discovery = JSON.parse(data);
      console.log('MCP discovery response:');
      console.log(JSON.stringify(discovery, null, 2));
      
      // Check if version is present
      if (discovery.version) {
        console.log(`\nMCP Version: ${discovery.version}`);
      } else {
        console.error('No version found in the discovery response');
      }
      
      // Check if transports are defined
      if (discovery.transports) {
        console.log('\nTransports found:');
        Object.keys(discovery.transports).forEach(transport => {
          console.log(`- ${transport}: ${discovery.transports[transport].endpoint}`);
        });
      } else {
        console.error('No transports found in the discovery response');
      }
      
      // Check if capabilities are present
      if (discovery.capabilities) {
        console.log('\nCapabilities found:');
        Object.keys(discovery.capabilities).forEach(capability => {
          console.log(`- ${capability}`);
        });
      } else {
        console.error('No capabilities found in the discovery response');
      }
      
      console.log('\nTest completed successfully');
    } catch (error) {
      console.error('Error parsing discovery response:', error);
      console.error('Raw response:', data);
    }
  });
}).on('error', (error) => {
  console.error(`Error: ${error.message}`);
});