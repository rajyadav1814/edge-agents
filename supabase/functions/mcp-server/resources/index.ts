// resources/index.ts
import { ResourceRegistry } from './registry.ts';

export function setupResources(server: any): ResourceRegistry {
  const resourceRegistry = new ResourceRegistry();
  resourceRegistry.registerWithServer(server);
  return resourceRegistry;
}