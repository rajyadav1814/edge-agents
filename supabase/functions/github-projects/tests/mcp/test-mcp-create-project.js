#!/usr/bin/env node

/**
 * Test script for the GitHub Projects MCP server
 * This script tests the createProject tool with the shortDescription parameter
 */

async function testCreateProject() {
  try {
    console.log('Testing createProject with shortDescription parameter...');
    
    const response = await fetch('http://localhost:8002/tools/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'createProject',
        arguments: {
          organization: 'agenticsorg',
          title: 'Test Project via MCP',
          shortDescription: 'This is a test project created via MCP with shortDescription'
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.project && result.project.shortDescription) {
      console.log('✅ SUCCESS: Project created with shortDescription parameter!');
    } else {
      console.log('❌ FAILURE: Project created but shortDescription not set correctly');
    }
  } catch (error) {
    console.error('Error testing createProject:', error.message);
  }
}

// Run the test
testCreateProject();
