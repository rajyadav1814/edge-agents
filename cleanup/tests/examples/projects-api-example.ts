/**
 * Example usage of the GitHub Projects API edge function
 * 
 * This file demonstrates how to use the GitHub Projects API endpoints
 * provided by the edge function.
 * 
 * To run this example:
 * 1. Set up your environment variables (GITHUB_TOKEN, GITHUB_ORG)
 * 2. Start the edge function locally: `supabase functions serve github-api`
 * 3. Run this example: `deno run --allow-net tests/examples/projects-api-example.ts`
 */

// Base URL for the edge function
const BASE_URL = 'http://localhost:54321/functions/v1/github-api';

// Helper function to make API requests
async function callApi(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`Making request to: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error);
    throw new Error(`API request failed: ${error.error}`);
  }
  
  return await response.json();
}

// Example 1: List projects for the organization
async function listProjects() {
  console.log('\n=== Example 1: List Projects ===');
  try {
    const data = await callApi('/projects/list');
    console.log(`Found ${data.organization.projectsV2.nodes.length} projects:`);
    
    data.organization.projectsV2.nodes.forEach((project: any) => {
      console.log(`- ${project.title} (${project.url})`);
    });
    
    // Return the first project for use in other examples
    return data.organization.projectsV2.nodes[0];
  } catch (error) {
    console.error('Failed to list projects:', error);
  }
}

// Example 2: Get project details
async function getProjectDetails(projectNumber: number) {
  console.log(`\n=== Example 2: Get Project Details (Number: ${projectNumber}) ===`);
  try {
    const data = await callApi(`/projects/detail?number=${projectNumber}`);
    const project = data.organization.projectV2;
    
    console.log(`Project: ${project.title}`);
    console.log(`Description: ${project.shortDescription}`);
    console.log(`URL: ${project.url}`);
    
    console.log('\nFields:');
    project.fields.nodes.forEach((field: any) => {
      console.log(`- ${field.name} (${field.id})`);
    });
    
    if (project.items) {
      console.log('\nItems:');
      project.items.nodes.forEach((item: any) => {
        console.log(`- ${item.content.title} (${item.content.url})`);
      });
    }
    
    return project;
  } catch (error) {
    console.error('Failed to get project details:', error);
  }
}

// Example 3: Add an item to a project
async function addItemToProject(projectId: string, issueId: string) {
  console.log(`\n=== Example 3: Add Item to Project ===`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Issue ID: ${issueId}`);
  
  try {
    const data = await callApi('/projects/add-item', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        contentId: issueId
      })
    });
    
    console.log('Item added successfully!');
    console.log('New item ID:', data.addProjectV2ItemById.item.id);
    
    return data.addProjectV2ItemById.item.id;
  } catch (error) {
    console.error('Failed to add item to project:', error);
  }
}

// Example 4: Update a project item field
async function updateProjectItemField(projectId: string, itemId: string, fieldId: string, value: string) {
  console.log(`\n=== Example 4: Update Project Item Field ===`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Item ID: ${itemId}`);
  console.log(`Field ID: ${fieldId}`);
  console.log(`Value: ${value}`);
  
  try {
    const data = await callApi('/projects/update-field', {
      method: 'POST',
      body: JSON.stringify({
        projectId,
        itemId,
        fieldId,
        value
      })
    });
    
    console.log('Field updated successfully!');
    return data;
  } catch (error) {
    console.error('Failed to update project item field:', error);
  }
}

// Main function to run all examples
async function main() {
  console.log('GitHub Projects API Examples');
  console.log('===========================');
  
  // Example 1: List projects
  const firstProject = await listProjects();
  if (!firstProject) {
    console.log('No projects found. Exiting...');
    return;
  }
  
  // Example 2: Get project details
  const projectNumber = firstProject.number;
  const projectDetails = await getProjectDetails(projectNumber);
  
  // Note: Examples 3 and 4 require actual IDs from your GitHub account
  // Uncomment and replace with real IDs to test
  
  /*
  // Example 3: Add an item to a project
  const projectId = projectDetails.id;
  const issueId = 'I_kwDOABCD123'; // Replace with a real issue ID
  const newItemId = await addItemToProject(projectId, issueId);
  
  // Example 4: Update a project item field
  if (newItemId && projectDetails.fields.nodes.length > 0) {
    const fieldId = projectDetails.fields.nodes[0].id;
    await updateProjectItemField(projectId, newItemId, fieldId, "New Value");
  }
  */
  
  console.log('\nAll examples completed!');
}

// Run the examples
main().catch(error => {
  console.error('Error running examples:', error);
});