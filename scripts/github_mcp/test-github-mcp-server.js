/**
 * GitHub MCP Server Test Script
 * 
 * This script verifies that the GitHub MCP server installation is working correctly.
 * It performs a series of tests to check server connectivity, API functionality,
 * authentication, and GitHub API integration.
 * 
 * Requirements:
 * - Node.js 14 or higher
 * - npm packages: node-fetch, dotenv, chalk
 */

// Import required modules
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
require('dotenv').config();

// Import chalk for colored console output
const chalk = require('chalk');

// Configuration with defaults
const config = {
  serverUrl: process.env.MCP_SERVER_URL || 'http://localhost:3000',
  githubToken: process.env.GITHUB_TOKEN || '',
  apiToken: process.env.API_TOKEN || '',
  testRepo: process.env.TEST_REPO || 'owner/repo', // Replace with a real repo for actual testing
  timeoutMs: 10000, // 10 seconds timeout for requests
  verbose: process.env.VERBOSE === 'true' || false
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Utility functions
const log = {
  info: (message) => console.log(chalk.blue('ℹ️ INFO: ') + message),
  success: (message) => console.log(chalk.green('✅ SUCCESS: ') + message),
  error: (message) => console.log(chalk.red('❌ ERROR: ') + message),
  warn: (message) => console.log(chalk.yellow('⚠️ WARNING: ') + message),
  debug: (message) => {
    if (config.verbose) {
      console.log(chalk.gray('🔍 DEBUG: ') + message);
    }
  }
};

/**
 * Make a request to the MCP server
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Request options
 * @returns {Promise<Object>} - The response data
 */
async function makeRequest(endpoint, options = {}) {
  const url = `${config.serverUrl}${endpoint}`;
  const startTime = performance.now();
  
  const defaultOptions = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(config.githubToken ? { 'Authorization': `Bearer ${config.githubToken}` } : {}),
      ...(config.apiToken ? { 'X-API-Token': config.apiToken } : {}),
      ...(options.headers || {})
    },
    timeout: config.timeoutMs
  };

  if (options.body) {
    defaultOptions.body = JSON.stringify(options.body);
  }

  try {
    log.debug(`Making ${defaultOptions.method} request to ${url}`);
    
    const response = await fetch(url, defaultOptions);
    const endTime = performance.now();
    const responseTime = endTime - startTime;
    
    let responseData;
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return {
      status: response.status,
      ok: response.ok,
      data: responseData,
      responseTime,
      headers: response.headers
    };
  } catch (error) {
    log.debug(`Request error: ${error.message}`);
    throw new Error(`Request to ${endpoint} failed: ${error.message}`);
  }
}

/**
 * Run a test and record the result
 * @param {string} name - Test name
 * @param {Function} testFn - Async test function
 */
async function runTest(name, testFn) {
  log.info(`Running test: ${name}`);
  
  try {
    const startTime = performance.now();
    await testFn();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    testResults.passed++;
    testResults.tests.push({
      name,
      status: 'passed',
      duration
    });
    
    log.success(`Test passed: ${name} (${duration.toFixed(2)}ms)`);
  } catch (error) {
    testResults.failed++;
    testResults.tests.push({
      name,
      status: 'failed',
      error: error.message
    });
    
    log.error(`Test failed: ${name}`);
    log.error(`  Error: ${error.message}`);
  }
}

/**
 * Skip a test and record it as skipped
 * @param {string} name - Test name
 * @param {string} reason - Reason for skipping
 */
function skipTest(name, reason) {
  testResults.skipped++;
  testResults.tests.push({
    name,
    status: 'skipped',
    reason
  });
  
  log.warn(`Test skipped: ${name}`);
  log.warn(`  Reason: ${reason}`);
}

// Test functions
async function testServerRunning() {
  const response = await makeRequest('/health');
  
  if (!response.ok || response.status !== 200) {
    throw new Error(`Server health check failed with status ${response.status}`);
  }
  
  log.debug(`Health check response: ${JSON.stringify(response.data)}`);
}

async function testServerVersion() {
  const response = await makeRequest('/version');
  
  if (!response.ok || response.status !== 200) {
    throw new Error(`Server version check failed with status ${response.status}`);
  }
  
  log.debug(`Server version: ${response.data}`);
}

async function testEnvironmentVariables() {
  // This test checks if the server has the required environment variables
  // We can infer this by trying an operation that requires GitHub token
  
  if (!config.githubToken) {
    skipTest('Environment Variables', 'No GitHub token provided');
    return;
  }
  
  const response = await makeRequest('/api/info', {
    method: 'GET'
  });
  
  if (!response.ok) {
    throw new Error('Server environment variables may not be properly configured');
  }
}

async function testAuthentication() {
  if (!config.githubToken) {
    skipTest('Authentication', 'No GitHub token provided');
    return;
  }
  
  // Test with valid token
  const validResponse = await makeRequest('/api/auth/verify', {
    method: 'POST',
    body: { token: config.githubToken }
  });
  
  if (!validResponse.ok) {
    throw new Error('Authentication failed with valid token');
  }
  
  // Test with invalid token
  const invalidResponse = await makeRequest('/api/auth/verify', {
    method: 'POST',
    body: { token: 'invalid_token' },
    headers: {
      'Authorization': 'Bearer invalid_token'
    }
  });
  
  if (invalidResponse.ok) {
    throw new Error('Authentication succeeded with invalid token');
  }
}

async function testSearchEndpoint() {
  if (!config.githubToken) {
    skipTest('Search Endpoint', 'No GitHub token provided');
    return;
  }
  
  const response = await makeRequest('/api/search', {
    method: 'POST',
    body: {
      query: 'function',
      repo: config.testRepo,
      limit: 5
    }
  });
  
  if (!response.ok) {
    throw new Error(`Search endpoint failed with status ${response.status}`);
  }
  
  // Verify response structure
  if (!response.data || !Array.isArray(response.data.results)) {
    throw new Error('Search endpoint returned invalid response structure');
  }
  
  log.debug(`Search results: ${JSON.stringify(response.data)}`);
}

async function testContentEndpoint() {
  if (!config.githubToken) {
    skipTest('Content Endpoint', 'No GitHub token provided');
    return;
  }
  
  const response = await makeRequest('/api/content', {
    method: 'POST',
    body: {
      repo: config.testRepo,
      path: 'README.md' // Most repos have a README.md
    }
  });
  
  if (!response.ok) {
    throw new Error(`Content endpoint failed with status ${response.status}`);
  }
  
  // Verify response structure
  if (!response.data || typeof response.data.content !== 'string') {
    throw new Error('Content endpoint returned invalid response structure');
  }
  
  log.debug(`Content response received, length: ${response.data.content.length}`);
}

async function testErrorHandling() {
  // Test invalid endpoint
  const invalidEndpoint = await makeRequest('/api/nonexistent');
  if (invalidEndpoint.status !== 404) {
    throw new Error(`Invalid endpoint should return 404, got ${invalidEndpoint.status}`);
  }
  
  // Test invalid request body
  const invalidBody = await makeRequest('/api/search', {
    method: 'POST',
    body: { invalid: 'data' }
  });
  
  if (invalidBody.status === 200) {
    throw new Error('Server accepted invalid request body');
  }
}

async function testPerformance() {
  // Test response time for health endpoint
  const healthStart = performance.now();
  await makeRequest('/health');
  const healthEnd = performance.now();
  const healthTime = healthEnd - healthStart;
  
  log.debug(`Health endpoint response time: ${healthTime.toFixed(2)}ms`);
  
  if (healthTime > 1000) {
    log.warn(`Health endpoint response time is high: ${healthTime.toFixed(2)}ms`);
  }
  
  // If we have a token, test GitHub API performance
  if (config.githubToken) {
    const apiStart = performance.now();
    await makeRequest('/api/search', {
      method: 'POST',
      body: {
        query: 'test',
        repo: config.testRepo,
        limit: 1
      }
    });
    const apiEnd = performance.now();
    const apiTime = apiEnd - apiStart;
    
    log.debug(`API endpoint response time: ${apiTime.toFixed(2)}ms`);
    
    if (apiTime > 5000) {
      log.warn(`API endpoint response time is high: ${apiTime.toFixed(2)}ms`);
    }
  }
}

/**
 * Generate a test report
 */
function generateReport() {
  const total = testResults.passed + testResults.failed + testResults.skipped;
  const passRate = total > 0 ? (testResults.passed / total * 100).toFixed(2) : '0.00';
  
  console.log('\n' + chalk.bold('=== GitHub MCP Server Test Report ==='));
  console.log(chalk.bold(`Server URL: ${config.serverUrl}`));
  console.log(chalk.bold(`Date: ${new Date().toISOString()}`));
  console.log(chalk.bold('======================================='));
  console.log(chalk.bold(`Total Tests: ${total}`));
  console.log(chalk.green.bold(`Passed: ${testResults.passed}`));
  console.log(chalk.red.bold(`Failed: ${testResults.failed}`));
  console.log(chalk.yellow.bold(`Skipped: ${testResults.skipped}`));
  console.log(chalk.bold(`Pass Rate: ${passRate}%`));
  console.log(chalk.bold('======================================='));
  
  console.log(chalk.bold('\nTest Details:'));
  testResults.tests.forEach(test => {
    if (test.status === 'passed') {
      console.log(`${chalk.green('✓')} ${test.name} ${chalk.gray(`(${test.duration.toFixed(2)}ms)`)}`);
    } else if (test.status === 'failed') {
      console.log(`${chalk.red('✗')} ${test.name}`);
      console.log(`  ${chalk.red('Error:')} ${test.error}`);
    } else if (test.status === 'skipped') {
      console.log(`${chalk.yellow('⚠')} ${test.name} ${chalk.gray(`(${test.reason})`)}`);
    }
  });
  
  // Save report to file
  const reportData = {
    timestamp: new Date().toISOString(),
    serverUrl: config.serverUrl,
    summary: {
      total,
      passed: testResults.passed,
      failed: testResults.failed,
      skipped: testResults.skipped,
      passRate
    },
    tests: testResults.tests
  };
  
  const reportDir = path.join(__dirname, 'test-reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  const reportPath = path.join(reportDir, `mcp-test-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(chalk.bold(`\nReport saved to: ${reportPath}`));
  
  return testResults.failed === 0;
}

/**
 * Main function to run all tests
 */
async function runAllTests() {
  console.log(chalk.bold('=== GitHub MCP Server Test Suite ==='));
  console.log(chalk.bold(`Testing server at: ${config.serverUrl}`));
  console.log(chalk.bold('==================================\n'));
  
  // Check if GitHub token is provided
  if (!config.githubToken) {
    log.warn('No GitHub token provided. Some tests will be skipped.');
    log.warn('Set the GITHUB_TOKEN environment variable to run all tests.');
  }
  
  // Run tests
  await runTest('Server Running', testServerRunning);
  await runTest('Server Version', testServerVersion);
  await runTest('Environment Variables', testEnvironmentVariables);
  await runTest('Authentication', testAuthentication);
  await runTest('Search Endpoint', testSearchEndpoint);
  await runTest('Content Endpoint', testContentEndpoint);
  await runTest('Error Handling', testErrorHandling);
  await runTest('Performance', testPerformance);
  
  // Generate and return report
  const success = generateReport();
  
  // Return exit code based on test results
  return success ? 0 : 1;
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runAllTests()
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      log.error(`Test suite execution failed: ${error.message}`);
      process.exit(1);
    });
}

// Export functions for use in other modules
module.exports = {
  runAllTests,
  makeRequest,
  config
};