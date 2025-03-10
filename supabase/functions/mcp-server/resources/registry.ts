// resources/registry.ts
import { 
  ListResourcesRequestSchema,
  ListResourceTemplatesRequestSchema,
  ReadResourceRequestSchema,
  McpError,
  ErrorCode
} from 'https://esm.sh/@modelcontextprotocol/sdk/types.js';
import { databaseResources, databaseResourceTemplates } from './handlers/database.ts';
import { storageResources, storageResourceTemplates } from './handlers/storage.ts';
import { systemResources } from './handlers/system.ts';

// Resource handler type definition
export interface ResourceHandler {
  uri: string;
  name: string;
  mimeType: string;
  description?: string;
  handler: (uri: string) => Promise<any>;
}

// Resource template handler type definition
export interface ResourceTemplateHandler {
  uriTemplate: string;
  name: string;
  mimeType: string;
  description?: string;
  handler: (uri: string) => Promise<any>;
}

export class ResourceRegistry {
  private resources: Map<string, ResourceHandler> = new Map();
  private resourceTemplates: Map<string, ResourceTemplateHandler> = new Map();
  
  constructor() {
    // Register all resources
    this.registerResources([
      ...databaseResources,
      ...storageResources,
      ...systemResources
    ]);
    
    // Register all resource templates
    this.registerResourceTemplates([
      ...databaseResourceTemplates,
      ...storageResourceTemplates
    ]);
  }
  
  // Register a single resource
  registerResource(resource: ResourceHandler): void {
    if (this.resources.has(resource.uri)) {
      throw new Error(`Resource with URI '${resource.uri}' already exists`);
    }
    
    this.resources.set(resource.uri, resource);
  }
  
  // Register multiple resources
  registerResources(resources: ResourceHandler[]): void {
    for (const resource of resources) {
      this.registerResource(resource);
    }
  }
  
  // Register a single resource template
  registerResourceTemplate(template: ResourceTemplateHandler): void {
    if (this.resourceTemplates.has(template.uriTemplate)) {
      throw new Error(`Resource template with URI template '${template.uriTemplate}' already exists`);
    }
    
    this.resourceTemplates.set(template.uriTemplate, template);
  }
  
  // Register multiple resource templates
  registerResourceTemplates(templates: ResourceTemplateHandler[]): void {
    for (const template of templates) {
      this.registerResourceTemplate(template);
    }
  }
  
  // Get a resource by URI
  getResource(uri: string): ResourceHandler | undefined {
    return this.resources.get(uri);
  }
  
  // Get all resources
  getAllResources(): ResourceHandler[] {
    return Array.from(this.resources.values());
  }
  
  // Get all resource templates
  getAllResourceTemplates(): ResourceTemplateHandler[] {
    return Array.from(this.resourceTemplates.values());
  }
  
  // Find a matching resource template for a URI
  findMatchingTemplate(uri: string): { template: ResourceTemplateHandler, params: Record<string, string> } | undefined {
    for (const [templateUri, template] of this.resourceTemplates.entries()) {
      const pattern = templateUri.replace(/\{([^}]+)\}/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = uri.match(regex);
      
      if (match) {
        // Extract parameter names from the template
        const paramNames: string[] = [];
        templateUri.replace(/\{([^}]+)\}/g, (_, name) => {
          paramNames.push(name);
          return '';
        });
        
        // Create params object
        const params: Record<string, string> = {};
        for (let i = 0; i < paramNames.length; i++) {
          params[paramNames[i]] = match[i + 1];
        }
        
        return { template, params };
      }
    }
    
    return undefined;
  }
  
  // Handle list resources request
  async handleListResources(): Promise<any> {
    const resources = this.getAllResources().map(resource => ({
      uri: resource.uri,
      name: resource.name,
      mimeType: resource.mimeType,
      description: resource.description
    }));
    
    return { resources };
  }
  
  // Handle list resource templates request
  async handleListResourceTemplates(): Promise<any> {
    const resourceTemplates = this.getAllResourceTemplates().map(template => ({
      uriTemplate: template.uriTemplate,
      name: template.name,
      mimeType: template.mimeType,
      description: template.description
    }));
    
    return { resourceTemplates };
  }
  
  // Handle read resource request
  async handleReadResource(uri: string): Promise<any> {
    // First, try to find a direct resource match
    const resource = this.getResource(uri);
    
    if (resource) {
      try {
        const content = await resource.handler(uri);
        
        return {
          contents: [
            {
              uri,
              mimeType: resource.mimeType,
              text: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
            }
          ]
        };
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, `Error accessing resource: ${error.message}`);
      }
    }
    
    // If no direct match, try to find a matching template
    const templateMatch = this.findMatchingTemplate(uri);
    
    if (templateMatch) {
      try {
        const content = await templateMatch.template.handler(uri);
        
        return {
          contents: [
            {
              uri,
              mimeType: templateMatch.template.mimeType,
              text: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
            }
          ]
        };
      } catch (error: any) {
        throw new McpError(ErrorCode.InternalError, `Error accessing resource: ${error.message}`);
      }
    }
    
    // If no match found, throw an error
    throw new McpError(ErrorCode.NotFound, `Resource not found: ${uri}`);
  }
  
  // Register request handlers with the MCP server
  registerWithServer(server: any): void {
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return this.handleListResources();
    });
    
    server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
      return this.handleListResourceTemplates();
    });
    
    server.setRequestHandler(ReadResourceRequestSchema, async (request: any) => {
      const { uri } = request.params;
      return this.handleReadResource(uri);
    });
  }
}