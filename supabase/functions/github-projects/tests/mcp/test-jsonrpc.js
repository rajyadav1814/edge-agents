// Test script for JSON-RPC functionality
const http = require('http');

const MCP_URL = 'http://localhost:8002';

// Function to make a JSON-RPC request
function makeJsonRpcRequest(method, params) {
  return new Promise((resolve, reject) => {
    // Create the JSON-RPC request object
    const jsonRpcRequest = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: method,
      params: params
    };
    
    // Convert to JSON string
    const requestData = JSON.stringify(jsonRpcRequest);
    
    // Set up the HTTP request options
    const options = {
      hostname: 'localhost',
      port: 8002,
      path: '/',
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
          // For SSE responses, we need to parse the event data
          if (res.headers['content-type'] === 'text/event-stream') {
            // Extract the JSON data from the SSE event
            const eventMatch = data.match(/event: response\ndata: (.+)\n\n/);
            if (eventMatch && eventMatch[1]) {
              const jsonResponse = JSON.parse(eventMatch[1]);
              resolve(jsonResponse);
            } else {
              reject(new Error('Invalid SSE response format'));
            }
          } else {
            // Regular JSON response
            const jsonResponse = JSON.parse(data);
            resolve(jsonResponse);
          }
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

// Test all available methods
async function runTests() {
  try {
    console.log('Testing getRepository method...');
    const repoResult = await makeJsonRpcRequest('getRepository', {
      owner: 'octocat',
      repo: 'hello-world'
    });
    console.log('Repository result:', JSON.stringify(repoResult, null, 2));
    
    console.log('\nTesting listProjects method...');
    const projectsResult = await makeJsonRpcRequest('listProjects', {
      organization: 'octocat-org',
      limit: 5
    });
    console.log('Projects result:', JSON.stringify(projectsResult, null, 2));
    
    console.log('\nTesting getProject method...');
    const projectResult = await makeJsonRpcRequest('getProject', {
      organization: 'octocat-org',
      projectNumber: 1
    });
    console.log('Project result:', JSON.stringify(projectResult, null, 2));
    
    console.log('\nTesting executeGraphQL method...');
    const graphqlResult = await makeJsonRpcRequest('executeGraphQL', {
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
    console.log('GraphQL result:', JSON.stringify(graphqlResult, null, 2));
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
runTests();