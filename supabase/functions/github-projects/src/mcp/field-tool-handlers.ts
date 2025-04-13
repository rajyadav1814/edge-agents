/**
 * MCP Field Tool Handlers
 * 
 * This file contains the handlers for MCP tools that interact with GitHub Projects field values.
 */

import { SSEEventEmitter } from '../sse/event-emitter.ts';

/**
 * Handle the updateProjectFieldValue tool
 * @param args Tool arguments
 * @param context MCP context
 * @returns Tool response
 */
export async function handleUpdateProjectFieldValueTool(args: any, context: any) {
  const { projectId, itemId, fieldId, optionId } = args;
  
  if (!projectId) {
    throw new Error('Missing required parameter: projectId');
  }
  
  if (!itemId) {
    throw new Error('Missing required parameter: itemId');
  }
  
  if (!fieldId) {
    throw new Error('Missing required parameter: fieldId');
  }
  
  if (!optionId) {
    throw new Error('Missing required parameter: optionId');
  }
  
  const fieldService = context.services.projectFieldService;
  const sseEmitter = context.services.sseEmitter;
  
  try {
    const updatedItem = await fieldService.updateProjectFieldValue(
      projectId,
      itemId,
      fieldId,
      optionId
    );
    
    // Emit SSE event for field update
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
    throw new Error(`Failed to update project field value: ${error.message}`);
  }
}
