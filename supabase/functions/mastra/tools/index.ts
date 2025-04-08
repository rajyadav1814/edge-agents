/**
 * Tools module index for the Mastra AI agent
 * 
 * This module exports all tool components for easy access.
 */

import { weatherTool } from "./weather.ts";
import { Tool } from "../types/index.ts";

/**
 * Collection of all available tools for the Mastra AI agent
 */
export const tools: Tool[] = [
  weatherTool,
  // Add more tools here as they are implemented
];

/**
 * Get a tool by its ID
 * 
 * @param id The ID of the tool to find
 * @returns The tool with the specified ID, or undefined if not found
 */
export const getToolById = (id: string): Tool | undefined => {
  return tools.find(tool => tool.id === id);
};

/**
 * Execute a tool by its ID with the provided context
 * 
 * @param id The ID of the tool to execute
 * @param context The context to pass to the tool
 * @returns The result of the tool execution
 * @throws Error if the tool is not found
 */
export const executeToolById = async (id: string, context: Record<string, unknown>): Promise<unknown> => {
  const tool = getToolById(id);
  
  if (!tool) {
    throw new Error(`Tool not found: ${id}`);
  }
  
  return await tool.execute({ context });
};

export default tools;