/**
 * Test script for the anonymizer daisy chain
 * 
 * Usage:
 * node test-anonymizer-chain.js <anonymizer-url> <user-token>
 */

// Check arguments
if (process.argv.length < 4) {
  console.error('Usage: node test-anonymizer-chain.js <anonymizer-url> <user-token>');
  process.exit(1);
}

const anonymizerUrl = process.argv[2];
const userToken = process.argv[3];

// Test data to send
const testData = {
  message: "This is a test message",
  action: "process",
  testTimestamp: Date.now(),
  metadata: {
    source: "test-script",
    version: "1.0.0"
  }
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

/**
 * Send a request to the anonymizer function
 */
async function testAnonymizer() {
  console.log(`${colors.bright}${colors.blue}Testing Anonymizer Chain${colors.reset}`);
  console.log(`${colors.dim}URL: ${anonymizerUrl}${colors.reset}`);
  console.log(`${colors.dim}Token: ${userToken.substring(0, 5)}...${userToken.substring(userToken.length - 5)}${colors.reset}`);
  console.log(`${colors.dim}Test Data: ${JSON.stringify(testData, null, 2)}${colors.reset}`);
  
  console.log(`\n${colors.yellow}Sending request to anonymizer...${colors.reset}`);
  
  try {
    const startTime = Date.now();
    
    const response = await fetch(anonymizerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify(testData)
    });
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    const result = await response.json();
    
    console.log(`\n${colors.green}Response received in ${responseTime}ms${colors.reset}`);
    console.log(`${colors.dim}Status: ${response.status} ${response.statusText}${colors.reset}`);
    
    // Check if the response contains anonymized data
    if (result.userIdHash || result.ipHash) {
      console.log(`\n${colors.green}✓ Anonymization successful${colors.reset}`);
      
      if (result.userIdHash) {
        console.log(`${colors.dim}User ID Hash: ${result.userIdHash}${colors.reset}`);
      }
      
      if (result.ipHash) {
        console.log(`${colors.dim}IP Hash: ${result.ipHash}${colors.reset}`);
      }
      
      if (result.geoHash) {
        console.log(`${colors.dim}Geo Hash: ${result.geoHash}${colors.reset}`);
      }
    }
    
    // Check if processing was completed
    if (result.processingComplete) {
      console.log(`\n${colors.green}✓ Processing completed${colors.reset}`);
      console.log(`${colors.dim}Processing Timestamp: ${new Date(result.processingTimestamp).toISOString()}${colors.reset}`);
    }
    
    // Check if finalization was completed
    if (result.status === "completed") {
      console.log(`\n${colors.green}✓ Finalization completed${colors.reset}`);
      console.log(`${colors.dim}Finalization Timestamp: ${new Date(result.finalizationTimestamp).toISOString()}${colors.reset}`);
      
      if (result.storageSuccess) {
        console.log(`${colors.green}✓ Data stored successfully${colors.reset}`);
      } else {
        console.log(`${colors.red}✗ Data storage failed${colors.reset}`);
      }
    }
    
    // Original data should not be present
    if (!result.userId && !result.ipAddress && !result.geolocation) {
      console.log(`\n${colors.green}✓ Original sensitive data not present in response${colors.reset}`);
    } else {
      console.log(`\n${colors.red}✗ WARNING: Original sensitive data found in response${colors.reset}`);
    }
    
    // Test data should be preserved
    if (result.message === testData.message && 
        result.action === testData.action && 
        result.testTimestamp === testData.testTimestamp) {
      console.log(`\n${colors.green}✓ Non-sensitive data preserved${colors.reset}`);
    } else {
      console.log(`\n${colors.yellow}⚠ Some non-sensitive data was modified${colors.reset}`);
    }
    
    console.log(`\n${colors.bright}${colors.blue}Complete Response:${colors.reset}`);
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error(`\n${colors.red}Error testing anonymizer:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the test
testAnonymizer().catch(error => {
  console.error(`\n${colors.red}Unhandled error:${colors.reset}`, error);
  process.exit(1);
});