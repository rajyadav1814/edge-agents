// Test script for standard MCP discovery endpoint
const http = require('http');

const MCP_URL = 'http://localhost:8002';

console.log(`Testing standard MCP discovery endpoint at ${MCP_URL}/.well-known/mcp.json`);

// Make a request to the standard discovery endpoint
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
      console.log('Standard MCP discovery response:');
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
      
      // Check if tools are present
      if (discovery.tools) {
        console.log('\nTools found:');
        Object.keys(discovery.tools).forEach(tool => {
          console.log(`- ${tool}: ${discovery.tools[tool].description}`);
        });
      } else {
        console.error('No tools found in the discovery response');
      }
      
      // Check if resources are present
      if (discovery.resources) {
        console.log('\nResources found:');
        Object.keys(discovery.resources).forEach(resource => {
          console.log(`- ${resource}: ${discovery.resources[resource].description}`);
        });
      } else {
        console.error('No resources found in the discovery response');
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