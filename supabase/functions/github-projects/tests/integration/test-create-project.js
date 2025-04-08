#!/usr/bin/env node

/**
 * Test script for the GitHub Projects MCP server
 * This script tests the createProject tool with the shortDescription parameter
 */

// Load environment variables from .env file
require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testCreateProject() {
  try {
    console.log('Testing createProject with shortDescription parameter...');
    
    const projectTitle = `Test Project ${Date.now()}`;
    const projectDescription = 'This is a test project created via MCP test';
    
    const response = await fetch('http://localhost:8002/tools/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'createProject',
        arguments: {
          organization: process.env.GITHUB_ORG || 'agenticsorg',
          title: projectTitle,
          shortDescription: projectDescription
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('Response:', JSON.stringify(result, null, 2));
    
    if (result.project && result.project.shortDescription === projectDescription) {
      console.log('✅ SUCCESS: Project created with shortDescription parameter!');
      console.log(`Project title: ${result.project.title}`);
      console.log(`Project description: ${result.project.shortDescription}`);
      process.exit(0);
    } else {
      console.log('❌ FAILURE: Project created but shortDescription not set correctly');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error testing createProject:', error.message);
    process.exit(1);
  }
}

// Run the test
testCreateProject();