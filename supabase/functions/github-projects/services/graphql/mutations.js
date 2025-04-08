/**
 * GraphQL mutations for GitHub Projects API
 * 
 * This file contains GraphQL mutation queries for project operations
 * including create, update, and delete operations.
 */

/**
 * Create a new project in an organization
 */
const CREATE_PROJECT_MUTATION = `
  mutation CreateProject($organization: String!, $title: String!, $shortDescription: String) {
    createProjectV2(
      input: {
        ownerId: $organization,
        title: $title,
        shortDescription: $shortDescription
      }
    ) {
      projectV2 {
        id
        title
        number
        shortDescription
        url
        closed
        public
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Create a new project item (draft issue)
 */
const CREATE_PROJECT_ITEM_MUTATION = `
  mutation CreateProjectItem($projectId: ID!, $title: String!, $body: String) {
    addProjectV2DraftIssue(
      input: {
        projectId: $projectId,
        title: $title,
        body: $body
      }
    ) {
      projectItem {
        id
        type
        databaseId
        content {
          ... on DraftIssue {
            id
            title
            body
            createdAt
            updatedAt
          }
        }
      }
    }
  }
`;

/**
 * Update an existing project
 */
const UPDATE_PROJECT_MUTATION = `
  mutation UpdateProject($projectId: ID!, $title: String, $description: String, $public: Boolean) {
    updateProjectV2(
      input: {
        projectId: $projectId,
        title: $title,
        shortDescription: $description,
        public: $public
      }
    ) {
      projectV2 {
        id
        title
        number
        shortDescription
        url
        closed
        public
        createdAt
        updatedAt
      }
    }
  }
`;

/**
 * Delete a project
 */
const DELETE_PROJECT_MUTATION = `
  mutation DeleteProject($projectId: ID!) {
    deleteProjectV2(input: { projectId: $projectId }) {
      clientMutationId
    }
  }
`;

/**
 * Delete a project item
 */
const DELETE_PROJECT_ITEM_MUTATION = `
  mutation DeleteProjectItem($itemId: ID!, $projectId: ID!) {
    deleteProjectV2Item(input: { itemId: $itemId, projectId: $projectId }) {
      clientMutationId
    }
  }
`;

/**
 * Update a project item (draft issue)
 */
const UPDATE_PROJECT_ITEM_MUTATION = `
  mutation UpdateProjectItem($itemId: ID!, $title: String, $body: String) {
    updateProjectV2DraftIssue(
      input: {
        draftIssueId: $itemId,
        title: $title,
        body: $body
      }
    ) {
      draftIssue {
        id
        title
        body
      }
    }
  }
`;

module.exports = {
  CREATE_PROJECT_MUTATION,
  CREATE_PROJECT_ITEM_MUTATION,
  UPDATE_PROJECT_MUTATION,
  DELETE_PROJECT_MUTATION,
  DELETE_PROJECT_ITEM_MUTATION,
  UPDATE_PROJECT_ITEM_MUTATION
};
