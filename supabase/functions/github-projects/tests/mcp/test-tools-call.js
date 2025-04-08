// Test script for tools/call endpoint
const http = require('http');

const MCP_URL = 'http://localhost:8002';

console.log(`Testing tools/call endpoint at ${MCP_URL}/tools/call`);

// Function to make a POST request to the tools/call endpoint
function makeToolsCallRequest(toolName, toolArgs) {
  return new Promise((resolve, reject) => {
    // Create the request object
    const requestData = JSON.stringify({
      params: {
        name: toolName,
        arguments: toolArgs
      }
    });
    
    // Set up the HTTP request options
    const options = {
      hostname: 'localhost',
      port: 8002,
      path: '/tools/call',
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
    // Test getRepository tool
    console.log('\nTesting getRepository tool...');
    const repoResponse = await makeToolsCallRequest('getRepository', {
      owner: 'octocat',
      repo: 'hello-world'
    });
    console.log('Response:', JSON.stringify(repoResponse, null, 2));
    
    // Test listProjects tool
    console.log('\nTesting listProjects tool...');
    const projectsResponse = await makeToolsCallRequest('listProjects', {
      organization: 'octocat-org',
      limit: 5
    });
    console.log('Response:', JSON.stringify(projectsResponse, null, 2));
    
    // Test getProject tool
    console.log('\nTesting getProject tool...');
    const projectResponse = await makeToolsCallRequest('getProject', {
      organization: 'octocat-org',
      projectNumber: 1
    });
    console.log('Response:', JSON.stringify(projectResponse, null, 2));
    
    // Test executeGraphQL tool
    console.log('\nTesting executeGraphQL tool...');
    const graphqlResponse = await makeToolsCallRequest('executeGraphQL', {
      query: `
        query {
          repository(owner: "octocat", name: "hello-world") {
            name
            description
            url
          }
        }
      `
    });
    console.log('Response:', JSON.stringify(graphqlResponse, null, 2));
    
    // Test invalid tool
    console.log('\nTesting invalid tool...');
    const invalidResponse = await makeToolsCallRequest('invalidTool', {});
    console.log('Response:', JSON.stringify(invalidResponse, null, 2));
    
    console.log('\nAll tests completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
runTest();