/**
 * SSE Event Types for GitHub Projects
 * 
 * This file defines the event types and interfaces for Server-Sent Events (SSE)
 * related to GitHub Projects operations.
 */

/**
 * Event types enum
 */
export enum EventType {
  // Project events
  PROJECT_CREATED = 'project_created',
  PROJECT_UPDATED = 'project_updated',
  PROJECT_DELETED = 'project_deleted',
  
  // Project item events
  PROJECT_ITEM_CREATED = 'project_item_created',
  PROJECT_ITEM_UPDATED = 'project_item_updated',
  PROJECT_ITEM_DELETED = 'project_item_deleted',
  
  // System events
  ERROR = 'error',
  INFO = 'info'
}

/**
 * Base event interface
 */
export interface Event {
  type: string;
  timestamp: string;
}

/**
 * Project created event
 */
export interface ProjectCreatedEvent extends Event {
  type: EventType.PROJECT_CREATED;
  project: any;
}

/**
 * Project updated event
 */
export interface ProjectUpdatedEvent extends Event {
  type: EventType.PROJECT_UPDATED;
  project: any;
  changes?: string[];
}

/**
 * Project deleted event
 */
export interface ProjectDeletedEvent extends Event {
  type: EventType.PROJECT_DELETED;
  projectId: string;
}

/**
 * Project item created event
 */
export interface ProjectItemCreatedEvent extends Event {
  type: EventType.PROJECT_ITEM_CREATED;
  item: any;
  projectId: string;
}

/**
 * Project item updated event
 */
export interface ProjectItemUpdatedEvent extends Event {
  type: EventType.PROJECT_ITEM_UPDATED;
  item: any;
  projectId?: string;
  changes?: string[];
}

/**
 * Project item deleted event
 */
export interface ProjectItemDeletedEvent extends Event {
  type: EventType.PROJECT_ITEM_DELETED;
  itemId: string;
  projectId: string;
}

/**
 * Error event
 */
export interface ErrorEvent extends Event {
  type: EventType.ERROR;
  message: string;
  code?: number;
}

/**
 * Info event
 */
export interface InfoEvent extends Event {
  type: EventType.INFO;
  message: string;
}

/**
 * Union type of all events
 */
export type GitHubProjectEvent =
  | ProjectCreatedEvent
  | ProjectUpdatedEvent
  | ProjectDeletedEvent
  | ProjectItemCreatedEvent
  | ProjectItemUpdatedEvent
  | ProjectItemDeletedEvent
  | ErrorEvent
  | InfoEvent;