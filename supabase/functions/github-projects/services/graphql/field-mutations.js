/**
 * GraphQL mutations for GitHub Projects field operations
 * 
 * This file contains GraphQL mutation queries for project field operations
 * including updating field values.
 */

/**
 * Update a project item field value (for single select fields like Status)
 */
const UPDATE_PROJECT_FIELD_VALUE_MUTATION = `
  mutation UpdateProjectFieldValue($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(
      input: {
        projectId: $projectId,
        itemId: $itemId,
        fieldId: $fieldId,
        value: {
          singleSelectOptionId: $optionId
        }
      }
    ) {
      projectV2Item {
        id
      }
    }
  }
`;

module.exports = {
  UPDATE_PROJECT_FIELD_VALUE_MUTATION
};
