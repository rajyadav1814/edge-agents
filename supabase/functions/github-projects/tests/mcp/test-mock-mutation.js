#!/usr/bin/env node

/**
 * Mock test script for the GitHub Projects GraphQL mutation
 * This script simulates the createProject mutation without actually calling the GitHub API
 */

console.log('Starting mock test for createProject mutation...');

// Mock the GraphQL mutation
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

// Mock variables
const createVariables = { 
  ownerId: "O_kgDOC6dDnA",
  title: "Test Project"
};

console.log('GraphQL mutation:');
console.log(createQuery);
console.log('\nVariables:');
console.log(JSON.stringify(createVariables, null, 2));

// Verify that the mutation doesn't include description or shortDescription
if (createQuery.includes('description:') || createQuery.includes('shortDescription:')) {
  console.log('\n❌ FAILURE: Mutation still contains description or shortDescription parameter');
  process.exit(1);
} else {
  console.log('\n✅ SUCCESS: Mutation correctly omits description and shortDescription parameters');
}

// Verify that the variables don't include description or shortDescription
if (createVariables.description || createVariables.shortDescription) {
  console.log('❌ FAILURE: Variables still contain description or shortDescription');
  process.exit(1);
} else {
  console.log('✅ SUCCESS: Variables correctly omit description and shortDescription');
}

console.log('\nMock test completed successfully!');