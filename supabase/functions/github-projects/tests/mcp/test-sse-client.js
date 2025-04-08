// Enhanced SSE client to debug the MCP discovery server
const http = require('http');

const MCP_URL = 'http://localhost:8002';

console.log(`Testing SSE connection to ${MCP_URL}/events`);

// Make a request to the SSE endpoint with explicit Accept header
const req = http.request(`${MCP_URL}/events`, {
  method: 'GET',
  headers: {
    'Accept': 'text/event-stream'
  }
}, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);
  
  // Check if the content type is correct
  const contentType = res.headers['content-type'];
  console.log(`Content-Type: ${contentType}`);
  
  if (contentType !== 'text/event-stream') {
    console.error(`Error: Invalid content type, expected "text/event-stream", got "${contentType}"`);
    
    // Try to read the response body to see what's being returned
    let responseBody = '';
    res.on('data', (chunk) => {
      responseBody += chunk.toString();
    });
    
    res.on('end', () => {
      console.log('Response body:', responseBody);
      process.exit(1);
    });
  } else {
    console.log('Content-Type is correct!');
    
    // Handle the SSE stream
    res.on('data', (chunk) => {
      console.log(`Received SSE data: ${chunk.toString()}`);
    });
    
    // Set a timeout to close the connection after 10 seconds
    setTimeout(() => {
      console.log('Test completed successfully');
      req.destroy();
      process.exit(0);
    }, 10000);
  }
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});

req.end();