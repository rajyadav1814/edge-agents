/**
 * Project Field Service
 * 
 * This service handles operations related to GitHub Project field values,
 * such as updating status fields, date fields, etc.
 */

const { graphqlClient } = require('../utils/graphql-client');
const { handleError } = require('../utils/error-handler');
const { UPDATE_PROJECT_FIELD_VALUE_MUTATION } = require('./graphql/field-mutations');

class ProjectFieldService {
  /**
   * Update a project item field value (for single select fields like Status)
   * 
   * @param {string} projectId - The ID of the project
   * @param {string} itemId - The ID of the project item
   * @param {string} fieldId - The ID of the field to update
   * @param {string} optionId - The ID of the single select option to set
   * @returns {Promise<Object>} - The updated project item
   */
  async updateProjectFieldValue(projectId, itemId, fieldId, optionId) {
    try {
      const variables = {
        projectId,
        itemId,
        fieldId,
        optionId
      };

      const response = await graphqlClient.request(
        UPDATE_PROJECT_FIELD_VALUE_MUTATION,
        variables
      );

      return response.updateProjectV2ItemFieldValue.projectV2Item;
    } catch (error) {
      return handleError(error, 'Failed to update project field value');
    }
  }
}

module.exports = new ProjectFieldService();
