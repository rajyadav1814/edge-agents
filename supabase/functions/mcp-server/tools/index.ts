// tools/index.ts
import { ToolRegistry } from './registry.ts';

export function setupTools(server: any): ToolRegistry {
  const toolRegistry = new ToolRegistry();
  toolRegistry.registerWithServer(server);
  return toolRegistry;
}