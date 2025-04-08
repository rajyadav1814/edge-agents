/**
 * MCP Tool Handlers
 * 
 * This file contains the handlers for MCP tools that interact with GitHub Projects.
 */

import { ProjectEditService } from '../../services/project-edit-service.ts';
import { ProjectDeleteService } from '../../services/project-delete-service.ts';
import { SSEEventEmitter } from '../sse/event-emitter.ts';

/**
 * Handle the editProject tool
 * @param args Tool arguments
 * @param context MCP context
 * @returns Tool response
 */
export async function handleEditProjectTool(args: any, context: any) {
  const { projectId, title, description, public: isPublic } = args;
  
  if (!projectId) {
    throw new Error('Missing required parameter: projectId');
  }
  
  if (!title && !description && isPublic === undefined) {
    throw new Error('At least one update parameter is required (title, description, or public)');
  }
  
  const projectService = context.services.projectEditService;
  const sseEmitter = context.services.sseEmitter;
  
  try {
    const updatedProject = await projectService.editProject(projectId, {
      title,
      description,
      public: isPublic
    });
    
    // Emit SSE event for project update
    if (sseEmitter) {
      sseEmitter.emitProjectUpdated(updatedProject);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(updatedProject, null, 2)
        }
      ],
      project: updatedProject
    };
  } catch (error: any) {
    throw new Error(`Failed to update project: ${error.message}`);
  }
}

/**
 * Handle the deleteProject tool
 * @param args Tool arguments
 * @param context MCP context
 * @returns Tool response
 */
export async function handleDeleteProjectTool(args: any, context: any) {
  const { projectId } = args;
  
  if (!projectId) {
    throw new Error('Missing required parameter: projectId');
  }
  
  const projectService = context.services.projectDeleteService;
  const sseEmitter = context.services.sseEmitter;
  
  try {
    const result = await projectService.deleteProject(projectId);
    
    // Emit SSE event for project deletion
    if (sseEmitter) {
      sseEmitter.emitProjectDeleted(projectId);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ],
      result
    };
  } catch (error: any) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

/**
 * Handle the editProjectItem tool
 * @param args Tool arguments
 * @param context MCP context
 * @returns Tool response
 */
export async function handleEditProjectItemTool(args: any, context: any) {
  const { itemId, title, body } = args;
  
  if (!itemId) {
    throw new Error('Missing required parameter: itemId');
  }
  
  if (!title && !body) {
    throw new Error('At least one update parameter is required (title or body)');
  }
  
  const projectService = context.services.projectEditService;
  const sseEmitter = context.services.sseEmitter;
  
  try {
    const updatedItem = await projectService.editProjectItem(itemId, {
      title,
      body
    });
    
    // Emit SSE event for item update
    if (sseEmitter) {
      sseEmitter.emitProjectItemUpdated(updatedItem);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(updatedItem, null, 2)
        }
      ],
      item: updatedItem
    };
  } catch (error: any) {
    throw new Error(`Failed to update project item: ${error.message}`);
  }
}

/**
 * Handle the deleteProjectItem tool
 * @param args Tool arguments
 * @param context MCP context
 * @returns Tool response
 */
export async function handleDeleteProjectItemTool(args: any, context: any) {
  const { itemId, projectId } = args;
  
  if (!itemId || !projectId) {
    throw new Error('Missing required parameters: itemId and projectId are required');
  }
  
  const projectService = context.services.projectDeleteService;
  const sseEmitter = context.services.sseEmitter;
  
  try {
    const result = await projectService.deleteProjectItem(itemId, projectId);
    
    // Emit SSE event for project item deletion
    if (sseEmitter) {
      sseEmitter.emitProjectItemDeleted(itemId, projectId);
    }
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }
      ],
      result
    };
  } catch (error: any) {
    throw new Error(`Failed to delete project item: ${error.message}`);
  }
}