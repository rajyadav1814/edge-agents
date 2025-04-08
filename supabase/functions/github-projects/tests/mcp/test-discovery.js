// Test script for MCP discovery endpoint
const http = require('http');

const MCP_URL = 'http://localhost:8002';

console.log(`Testing MCP discovery endpoint at ${MCP_URL}/mcp-discovery`);

// Make a request to the discovery endpoint
http.get(`${MCP_URL}/mcp-discovery`, (res) => {
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
      console.log('Discovery response:');
      console.log(JSON.stringify(discovery, null, 2));
      
      // Check if resources and tools are present
      if (discovery.resources) {
        console.log('\nResources found:');
        Object.keys(discovery.resources).forEach(resource => {
          console.log(`- ${resource}: ${discovery.resources[resource].description}`);
        });
      } else {
        console.error('No resources found in the discovery response');
      }
      
      if (discovery.tools) {
        console.log('\nTools found:');
        Object.keys(discovery.tools).forEach(tool => {
          console.log(`- ${tool}: ${discovery.tools[tool].description}`);
        });
      } else {
        console.error('No tools found in the discovery response');
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