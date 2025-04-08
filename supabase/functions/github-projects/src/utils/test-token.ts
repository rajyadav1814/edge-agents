/**
 * Simple script to test GitHub token
 */

// Get the token from environment variables
const token = Deno.env.get('GITHUB_TOKEN') || Deno.env.get('GITHUB_PERSONAL_ACCESS_TOKEN');

if (!token) {
  console.error('No GitHub token found in environment variables');
  Deno.exit(1);
}

console.log(`Using token: ${token.substring(0, 10)}...`);

// Test the token with a simple GraphQL query
async function testToken() {
  try {
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Test-Script',
        'Authorization': `token ${token}`
      },
      body: JSON.stringify({
        query: `query { viewer { login } }`
      })
    });

    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      const text = await response.text();
      console.error(`Response body: ${text}`);
      return;
    }

    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing token:', error);
  }
}

// Also try a REST API endpoint
async function testRestApi() {
  try {
    const response = await fetch('https://api.github.com/user', {
      method: 'GET',
      headers: {
        'User-Agent': 'Test-Script',
        'Authorization': `token ${token}`
      }
    });

    console.log(`REST API Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`Error: ${response.statusText}`);
      const text = await response.text();
      console.error(`Response body: ${text}`);
      return;
    }

    const data = await response.json();
    console.log('REST API Response data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error testing REST API:', error);
  }
}

// Run the tests
await testToken();
await testRestApi();