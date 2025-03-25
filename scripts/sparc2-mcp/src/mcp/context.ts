import { randomUUID } from 'crypto';
import { Context, AgentState, Message } from '../types/index.js';

/**
 * MCPContext provides a container for shared state and conversation history
 * within the SPARC2 MCP environment. It implements the Context interface
 * and provides methods for managing workflow state, conversation history,
 * and resource tracking.
 */
export class MCPContext implements Context {
  public conversation: Message[];
  public state: AgentState;
  public parent?: Context;

  /**
   * Create a new context, optionally inheriting from a parent context
   * @param parent Optional parent context to inherit from
   */
  constructor(parent?: Context) {
    this.parent = parent;
    this.conversation = parent ? [...parent.getConversationHistory()] : [];
    this.state = {
      collected_info: {},
      previous_actions: [],
      resources: {},
      memory: {}
    };

    // Inherit workflow ID from parent if available
    if (parent?.getWorkflowId()) {
      this.state.workflow_id = parent.getWorkflowId();
    }
  }

  /**
   * Add a message to the conversation history
   * @param message Message to add
   */
  public addMessage(message: Message): void {
    this.conversation.push(message);
  }

  /**
   * Get the full conversation history
   * @returns Array of messages
   */
  public getConversationHistory(): Message[] {
    return [...this.conversation];
  }

  /**
   * Set a value in the state
   * @param key Key to set
   * @param value Value to set
   */
  public setState<K extends keyof AgentState>(key: K, value: AgentState[K]): void {
    this.state[key] = value;
  }

  /**
   * Get a value from the state
   * @param key Key to get
   * @returns Value or undefined if not found
   */
  public getState<K extends keyof AgentState>(key: K): AgentState[K] | undefined {
    return this.state[key];
  }

  /**
   * Set a resource in the context
   * @param key Resource key
   * @param value Resource value
   */
  public setResource(key: string, value: any): void {
    if (!this.state.resources) {
      this.state.resources = {};
    }
    this.state.resources[key] = value;
  }

  /**
   * Get a resource from the context
   * @param key Resource key
   * @returns Resource value or undefined if not found
   */
  public getResource(key: string): any {
    return this.state.resources?.[key];
  }

  /**
   * Store a value in memory
   * @param key Memory key
   * @param value Memory value
   */
  public remember(key: string, value: any): void {
    if (!this.state.memory) {
      this.state.memory = {};
    }
    this.state.memory[key] = value;
  }

  /**
   * Retrieve a value from memory
   * @param key Memory key
   * @returns Memory value or undefined if not found
   */
  public recall(key: string): any {
    return this.state.memory?.[key];
  }

  /**
   * Track an action in the context
   * @param action Action to track
   */
  public trackAction(action: string): void {
    if (!this.state.previous_actions) {
      this.state.previous_actions = [];
    }
    this.state.previous_actions.push(action);
  }

  /**
   * Get all tracked actions
   * @returns Array of tracked actions
   */
  public getActions(): string[] {
    return [...(this.state.previous_actions || [])];
  }

  /**
   * Mark a field as collected
   * @param field Field to mark as collected
   */
  public markCollected(field: string): void {
    if (!this.state.collected_info) {
      this.state.collected_info = {};
    }
    this.state.collected_info[field] = true;
  }

  /**
   * Check if a field has been collected
   * @param field Field to check
   * @returns True if the field has been collected
   */
  public isCollected(field: string): boolean {
    return !!this.state.collected_info?.[field];
  }

  /**
   * Initialize a new workflow
   */
  public initializeWorkflow(): void {
    this.state.workflow_id = randomUUID();
  }

  /**
   * Get the current workflow ID
   * @returns Workflow ID or undefined if not set
   */
  public getWorkflowId(): string | undefined {
    return this.state.workflow_id;
  }
}