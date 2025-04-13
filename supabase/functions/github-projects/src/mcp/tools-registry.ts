/**
 * MCP Tools Registry
 * 
 * This file defines the available tools for the GitHub Projects MCP server.
 */

import { 
  handleEditProjectTool, 
  handleDeleteProjectTool,
  handleEditProjectItemTool,
  handleDeleteProjectItemTool
} from './tool-handlers.ts';
import { handleUpdateProjectFieldValueTool } from './field-tool-handlers.ts';

/**
 * Edit Project Tool
 */
export const editProjectTool = {
  name: 'editProject',
  description: 'Edit an existing GitHub Project',
  parameters: {
    projectId: {
      type: 'string',
      description: 'ID of the project to edit',
      required: true
    },
    title: {
      type: 'string',
      description: 'New title for the project',
      required: false
    },
    description: {
      type: 'string',
      description: 'New description for the project',
      required: false
    },
    public: {
      type: 'boolean',
      description: 'Whether the project should be public',
      required: false
    }
  },
  handler: handleEditProjectTool
};

/**
 * Delete Project Tool
 */
export const deleteProjectTool = {
  name: 'deleteProject',
  description: 'Delete a GitHub Project',
  parameters: {
    projectId: {
      type: 'string',
      description: 'ID of the project to delete',
      required: true
    }
  },
  handler: handleDeleteProjectTool
};

/**
 * Edit Project Item Tool
 */
export const editProjectItemTool = {
  name: 'editProjectItem',
  description: 'Edit an item in a GitHub Project',
  parameters: {
    itemId: {
      type: 'string',
      description: 'ID of the item to edit',
      required: true
    },
    title: {
      type: 'string',
      description: 'New title for the item',
      required: false
    },
    body: {
      type: 'string',
      description: 'New body content for the item',
      required: false
    }
  },
  handler: handleEditProjectItemTool
};

/**
 * Delete Project Item Tool
 */
export const deleteProjectItemTool = {
  name: 'deleteProjectItem',
  description: 'Delete an item from a GitHub Project',
  parameters: {
    itemId: {
      type: 'string',
      description: 'ID of the item to delete',
      required: true
    },
    projectId: {
      type: 'string',
      description: 'ID of the project containing the item',
      required: true
    }
  },
  handler: handleDeleteProjectItemTool
};

/**
 * Update Project Field Value Tool
 */
export const updateProjectFieldValueTool = {
  name: 'updateProjectFieldValue',
  description: 'Update a field value for a project item (e.g., status)',
  parameters: {
    projectId: {
      type: 'string',
      description: 'ID of the project',
      required: true
    },
    itemId: {
      type: 'string',
      description: 'ID of the project item',
      required: true
    },
    fieldId: {
      type: 'string',
      description: 'ID of the field to update',
      required: true
    },
    optionId: {
      type: 'string',
      description: 'ID of the single select option to set',
      required: true
    }
  },
  handler: handleUpdateProjectFieldValueTool
};

/**
 * Export all tools
 */
export const editDeleteTools = [
  editProjectTool,
  deleteProjectTool,
  editProjectItemTool,
  deleteProjectItemTool,
  updateProjectFieldValueTool
];
