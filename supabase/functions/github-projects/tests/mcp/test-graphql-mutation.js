#!/usr/bin/env node

/**
 * Test script for the GitHub Projects GraphQL mutation
 * This script directly tests the createProject mutation
 */

// Load environment variables
require('dotenv').config();

const githubToken = process.env.GITHUB_TOKEN || process.env.GITHUB_PERSONAL_ACCESS_TOKEN;
const githubOrg = process.env.GITHUB_ORG || 'agenticsorg';

if (!githubToken) {
  console.error('GitHub token is required. Set GITHUB_TOKEN or GITHUB_PERSONAL_ACCESS_TOKEN environment variable.');
  process.exit(1);
}

/**
 * Execute a GraphQL query against the GitHub API
 */
async function executeGraphQLQuery(query, variables) {
  try {
    console.log(`Executing GraphQL query with variables: ${JSON.stringify(variables)}`);
    
    const response = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Agentics-Supabase-Edge-Function',
        'Authorization': `token ${githubToken}`,
        'X-Github-Next-Global-ID': '1' // Required for Projects V2 API
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) {
      throw new Error(`Failed to execute GraphQL query: ${response.statusText}`);
    }

    const result = await response.json();

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors.map(e => e.message).join(', ');
      throw new Error(`GraphQL Error: ${errorMessages}`);
    }

    return result.data;
  } catch (error) {
    console.error('GraphQL query error:', error);
    throw error;
  }
}

async function testCreateProject() {
  try {
    // First get the organization ID
    const orgQuery = `
      query GetOrganizationId($login: String!) {
        organization(login: $login) {
          id
        }
      }
    `;
    
    const orgData = await executeGraphQLQuery(orgQuery, { login: githubOrg });
    
    if (!orgData.organization?.id) {
      throw new Error(`Organization ${githubOrg} not found or not accessible`);
    }
    
    // Create the project
    const createQuery = `
      mutation CreateProject($ownerId: ID!, $title: String!) {
        createProjectV2(
          input: {
            ownerId: $ownerId,
            title: $title
          }
        ) {
          projectV2 {
            id
            title
            number
            shortDescription
            url
            createdAt
          }
        }
      }
    `;
    
    const projectTitle = `Test Project ${Date.now()}`;
    
    const createVariables = { 
      ownerId: orgData.organization.id,
      title: projectTitle
    };
    
    const createData = await executeGraphQLQuery(createQuery, createVariables);
    
    if (!createData.createProjectV2?.projectV2) {
      throw new Error('Failed to create project');
    }
    
    const project = createData.createProjectV2.projectV2;
    
    console.log('Project created successfully:');
    console.log(JSON.stringify(project, null, 2));
    
    console.log('✅ SUCCESS: Project created successfully!');
    console.log(`Project title: ${project.title}`);
    console.log(`Project ID: ${project.id}`);
    process.exit(0);
  } catch (error) {
    console.error('Error testing createProject:', error.message);
    process.exit(1);
  }
}

// Run the test
testCreateProject();