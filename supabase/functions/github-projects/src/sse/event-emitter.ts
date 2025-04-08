/**
 * SSE Event Emitter for GitHub Projects
 * 
 * This class handles the emission of Server-Sent Events (SSE) for GitHub Projects operations.
 * It provides methods to emit events for project and project item operations.
 */

import { EventType, Event } from './event-types.ts';

/**
 * SSE Event Emitter class
 */
export class SSEEventEmitter {
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  
  /**
   * Add an event listener
   * @param eventType Event type to listen for
   * @param callback Callback function to execute when event is emitted
   */
  on(eventType: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(callback);
  }
  
  /**
   * Remove an event listener
   * @param eventType Event type
   * @param callback Callback function to remove
   */
  off(eventType: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      return;
    }
    
    const callbacks = this.listeners.get(eventType)!;
    callbacks.delete(callback);
    
    if (callbacks.size === 0) {
      this.listeners.delete(eventType);
    }
  }
  
  /**
   * Emit an event
   * @param eventType Event type
   * @param data Event data
   */
  emit(eventType: string, data: any): void {
    if (!this.listeners.has(eventType)) {
      return;
    }
    
    const callbacks = this.listeners.get(eventType)!;
    for (const callback of callbacks) {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in SSE event listener for ${eventType}:`, error);
      }
    }
  }
  
  /**
   * Emit a project created event
   * @param project The created project
   */
  emitProjectCreated(project: any): void {
    this.emit(EventType.PROJECT_CREATED, {
      type: EventType.PROJECT_CREATED,
      timestamp: new Date().toISOString(),
      project
    });
  }
  
  /**
   * Emit a project updated event
   * @param project The updated project
   * @param changes Optional list of changed fields
   */
  emitProjectUpdated(project: any, changes?: string[]): void {
    this.emit(EventType.PROJECT_UPDATED, {
      type: EventType.PROJECT_UPDATED,
      timestamp: new Date().toISOString(),
      project,
      changes
    });
  }
  
  /**
   * Emit a project deleted event
   * @param projectId The deleted project ID
   */
  emitProjectDeleted(projectId: string): void {
    this.emit(EventType.PROJECT_DELETED, {
      type: EventType.PROJECT_DELETED,
      timestamp: new Date().toISOString(),
      projectId
    });
  }
  
  /**
   * Emit a project item created event
   * @param item The created item
   * @param projectId The project ID
   */
  emitProjectItemCreated(item: any, projectId: string): void {
    this.emit(EventType.PROJECT_ITEM_CREATED, {
      type: EventType.PROJECT_ITEM_CREATED,
      timestamp: new Date().toISOString(),
      item,
      projectId
    });
  }
  
  /**
   * Emit a project item updated event
   * @param item The updated item
   * @param projectId Optional project ID
   * @param changes Optional list of changed fields
   */
  emitProjectItemUpdated(item: any, projectId?: string, changes?: string[]): void {
    this.emit(EventType.PROJECT_ITEM_UPDATED, {
      type: EventType.PROJECT_ITEM_UPDATED,
      timestamp: new Date().toISOString(),
      item,
      projectId,
      changes
    });
  }
  
  /**
   * Emit a project item deleted event
   * @param itemId The deleted item ID
   * @param projectId The project ID
   */
  emitProjectItemDeleted(itemId: string, projectId: string): void {
    this.emit(EventType.PROJECT_ITEM_DELETED, {
      type: EventType.PROJECT_ITEM_DELETED,
      timestamp: new Date().toISOString(),
      itemId,
      projectId
    });
  }
  
  /**
   * Emit an error event
   * @param message Error message
   * @param code Optional error code
   */
  emitError(message: string, code?: number): void {
    this.emit(EventType.ERROR, {
      type: EventType.ERROR,
      timestamp: new Date().toISOString(),
      message,
      code
    });
  }
  
  /**
   * Emit an info event
   * @param message Info message
   */
  emitInfo(message: string): void {
    this.emit(EventType.INFO, {
      type: EventType.INFO,
      timestamp: new Date().toISOString(),
      message
    });
  }
}