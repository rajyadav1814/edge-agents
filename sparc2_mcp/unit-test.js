#!/usr/bin/env node
/**
 * SPARC2 MCP Unit Tests
 * 
 * This script contains unit tests for the SPARC2 MCP server functionality.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import assert from 'assert';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the test file
const TEST_FILE_PATH = path.join(__dirname, 'test-file.js');
const BACKUP_FILE_PATH = path.join(__dirname, 'test-file.backup.js');

// Import the functions to test
import {
  readFile,
  writeFile,
  executeCode,
  createCheckpoint,
  rollback,
  analyzeCode,
  modifyCode
} from './sparc2_mcp.js';

/**
 * Run all tests
 */
async function runTests() {
  console.log('Running SPARC2 MCP unit tests...');
  
  let passed = 0;
  let failed = 0;
  
  // Create a backup of the test file
  if (fs.existsSync(TEST_FILE_PATH)) {
    fs.copyFileSync(TEST_FILE_PATH, BACKUP_FILE_PATH);
  }
  
  try {
    // Test readFile function
    await testReadFile();
    passed++;
    
    // Test writeFile function
    await testWriteFile();
    passed++;
    
    // Test analyzeCode function
    await testAnalyzeCode();
    passed++;
    
    // Test modifyCode function
    await testModifyCode();
    passed++;
    
    // Test executeCode function
    await testExecuteCode();
    passed++;
    
    // Test createCheckpoint function
    await testCreateCheckpoint();
    passed++;
    
    // Test rollback function
    await testRollback();
    passed++;
    
    console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
  } catch (error) {
    console.error('Test failed:', error);
    failed++;
    console.log(`\nTests completed: ${passed} passed, ${failed} failed`);
  } finally {
    // Restore the test file from backup
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      fs.copyFileSync(BACKUP_FILE_PATH, TEST_FILE_PATH);
      fs.unlinkSync(BACKUP_FILE_PATH);
    }
  }
}

/**
 * Test the readFile function
 */
async function testReadFile() {
  console.log('\nTesting readFile function...');
  
  try {
    const content = await readFile(TEST_FILE_PATH);
    assert.ok(content, 'File content should not be empty');
    assert.ok(content.includes('function add'), 'File content should contain the add function');
    console.log('✅ readFile test passed');
  } catch (error) {
    console.error('❌ readFile test failed:', error);
    throw error;
  }
}

/**
 * Test the writeFile function
 */
async function testWriteFile() {
  console.log('\nTesting writeFile function...');
  
  try {
    const originalContent = await readFile(TEST_FILE_PATH);
    const testContent = originalContent + '\n// Test comment added by unit test';
    
    await writeFile(TEST_FILE_PATH, testContent);
    const newContent = await readFile(TEST_FILE_PATH);
    
    assert.strictEqual(newContent, testContent, 'File content should match what was written');
    console.log('✅ writeFile test passed');
    
    // Restore original content
    await writeFile(TEST_FILE_PATH, originalContent);
  } catch (error) {
    console.error('❌ writeFile test failed:', error);
    throw error;
  }
}

/**
 * Test the analyzeCode function
 */
async function testAnalyzeCode() {
  console.log('\nTesting analyzeCode function...');
  
  try {
    const results = await analyzeCode([TEST_FILE_PATH], 'test analysis');
    
    assert.ok(Array.isArray(results), 'Results should be an array');
    assert.ok(results.length > 0, 'Results should not be empty');
    assert.ok(results[0].file === TEST_FILE_PATH, 'Result should reference the test file');
    assert.ok(Array.isArray(results[0].issues), 'Result should contain issues array');
    
    console.log('✅ analyzeCode test passed');
  } catch (error) {
    console.error('❌ analyzeCode test failed:', error);
    throw error;
  }
}

/**
 * Test the modifyCode function
 */
async function testModifyCode() {
  console.log('\nTesting modifyCode function...');
  
  try {
    const results = await modifyCode([TEST_FILE_PATH], 'Fix the divide function to handle division by zero');
    
    assert.ok(Array.isArray(results), 'Results should be an array');
    assert.ok(results.length > 0, 'Results should not be empty');
    assert.ok(results[0].file === TEST_FILE_PATH, 'Result should reference the test file');
    assert.ok('modified' in results[0], 'Result should indicate if file was modified');
    
    console.log('✅ modifyCode test passed');
  } catch (error) {
    console.error('❌ modifyCode test failed:', error);
    throw error;
  }
}

/**
 * Test the executeCode function
 */
async function testExecuteCode() {
  console.log('\nTesting executeCode function...');
  
  try {
    const code = 'console.log("Hello, world!");';
    const result = await executeCode(code, 'javascript');
    
    assert.ok(result, 'Result should not be empty');
    assert.ok(result.includes('Hello, world!') || result.includes('executed successfully'), 
              'Result should indicate successful execution');
    
    console.log('✅ executeCode test passed');
  } catch (error) {
    console.error('❌ executeCode test failed:', error);
    throw error;
  }
}

/**
 * Test the createCheckpoint function
 */
async function testCreateCheckpoint() {
  console.log('\nTesting createCheckpoint function...');
  
  try {
    const message = 'Test checkpoint';
    const result = await createCheckpoint(message);
    
    assert.ok(result, 'Result should not be empty');
    assert.ok(result.includes('checkpoint') && result.includes(message), 
              'Result should mention checkpoint and message');
    
    console.log('✅ createCheckpoint test passed');
  } catch (error) {
    console.error('❌ createCheckpoint test failed:', error);
    throw error;
  }
}

/**
 * Test the rollback function
 */
async function testRollback() {
  console.log('\nTesting rollback function...');
  
  try {
    const checkpointId = 'test-checkpoint-id';
    const result = await rollback(checkpointId);
    
    assert.ok(result, 'Result should not be empty');
    assert.ok(result.includes('checkpoint') && result.includes(checkpointId), 
              'Result should mention checkpoint and ID');
    
    console.log('✅ rollback test passed');
  } catch (error) {
    console.error('❌ rollback test failed:', error);
    throw error;
  }
}

// Run the tests
runTests().catch(console.error);