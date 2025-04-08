// Test script for tools/list endpoint
const http = require('http');

const MCP_URL = 'http://localhost:8002';

console.log(`Testing tools/list endpoint at ${MCP_URL}/tools/list`);

// Function to make a POST request to the tools/list endpoint
function makeToolsListRequest() {
  return new Promise((resolve, reject) => {
    // Create the request object
    const requestData = JSON.stringify({});
    
    // Set up the HTTP request options
    const options = {
      hostname: 'localhost',
      port: 8002,
      path: '/tools/list',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestData)
      }
    };
    
    // Make the request
    const req = http.request(options, (res) => {
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
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          console.error('Error parsing response:', error);
          console.error('Raw response:', data);
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`Error: ${error.message}`);
      reject(error);
    });
    
    // Send the request data
    req.write(requestData);
    req.end();
  });
}

// Run the test
async function runTest() {
  try {
    console.log('Making request to tools/list endpoint...');
    const response = await makeToolsListRequest();
    
    console.log('\nTools list response:');
    console.log(JSON.stringify(response, null, 2));
    
    // Check if tools are present
    if (response.tools && Array.isArray(response.tools)) {
      console.log(`\nFound ${response.tools.length} tools:`);
      
      response.tools.forEach((tool, index) => {
        console.log(`\nTool ${index + 1}: ${tool.name}`);
        console.log(`Description: ${tool.description || 'No description'}`);
        console.log(`Input Schema: ${JSON.stringify(tool.inputSchema, null, 2)}`);
      });
      
      console.log('\nTest completed successfully');
    } else {
      console.error('No tools found in the response');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();