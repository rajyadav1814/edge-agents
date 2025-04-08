# GitHub Projects MCP Edit and Delete Implementation Plan

## Overview

This implementation plan outlines the steps to add edit and delete capabilities to the GitHub Projects MCP servers (both STDIO and SSE versions). The plan follows the SPARC methodology and integrates our specification, architecture, and TDD approach.

## Features to Implement

1. **Edit Project**: Update project title, description, and visibility
2. **Delete Project**: Remove a project completely
3. **Edit Project Item**: Update item title and body content
4. **Delete Project Item**: Remove an item from a project
5. **SSE Events**: Real-time notifications for edit and delete operations

## Implementation Phases


**Objective**: Implement the core service layer for edit and delete operations

#### Tasks:

1. Create GraphQL mutation definitions
2. Implement project edit service
3. Implement project delete service
4. Write unit tests for services

#### Files to Create/Modify:

```
src/services/graphql/mutations.ts (new)
src/services/project-edit-service.ts (new)
src/services/project-delete-service.ts (new)
tests/unit/project-edit-service.test.ts (new)
tests/unit/project-delete-service.test.ts (new)
```

### Phase 2: MCP Tool Handlers (Days 3-4)

**Objective**: Implement MCP tool handlers for edit and delete operations

#### Tasks:

1. Create tool handler functions
2. Register tools with MCP server
3. Implement input validation
4. Write unit tests for tool handlers

#### Files to Create/Modify:

```
src/mcp/tool-handlers.ts (modify)
src/mcp/tools-registry.ts (modify)
src/utils/validation.ts (modify)
tests/unit/mcp-tool-handlers.test.ts (new)
```

### Phase 3: SSE Event System (Days 5-6)

**Objective**: Enhance SSE event system to support edit and delete events

#### Tasks:

1. Add new event types
2. Implement event emitters for edit/delete operations
3. Update SSE endpoint to handle new events
4. Write unit tests for event system

#### Files to Create/Modify:

```
src/sse/event-emitter.ts (modify)
src/sse/event-types.ts (new)
tests/unit/sse-event-emitter.test.ts (new)
```

### Phase 4: Integration (Days 7-8)

**Objective**: Integrate all components and ensure they work together

#### Tasks:

1. Update HTTP MCP server
2. Update STDIO MCP server
3. Implement integration tests
4. Fix any issues discovered during integration

#### Files to Create/Modify:

```
src/mcp/server/http-server.ts (modify)
src/mcp/server/stdio-server.ts (modify)
tests/integration/edit-project-mcp.test.ts (new)
tests/integration/delete-project-mcp.test.ts (new)
tests/integration/edit-project-stdio-mcp.test.ts (new)
tests/integration/delete-project-stdio-mcp.test.ts (new)
```

### Phase 5: Documentation and Finalization (Days 9-10)

**Objective**: Complete documentation and finalize implementation

#### Tasks:

1. Update API documentation
2. Add examples for new capabilities
3. Run end-to-end tests
4. Prepare for deployment

#### Files to Create/Modify:

```
docs/edit-delete-api.md (new)
docs/examples/edit-project-example.js (new)
docs/examples/delete-project-example.js (new)
tests/e2e/project-lifecycle.test.ts (new)
```

## Detailed Implementation

### 1. GraphQL Mutations

Create a new file `src/services/graphql/mutations.ts` with the following content:

```typescript
// GraphQL mutations for edit and delete operations

export const UPDATE_PROJECT_MUTATION = `
  mutation UpdateProject($projectId: ID!, $title: String, $description: String, $public: Boolean) {
    updateProjectV2(
      input: {
        projectId: $projectId,
        title: $title,
        shortDescription: $description,
        public: $public
      }
    ) {
      projectV2 {
        id
        title
        number
        shortDescription
        url
        closed
        public
        createdAt
        updatedAt
      }
    }
  }
`;

export const DELETE_PROJECT_MUTATION = `
  mutation DeleteProject($projectId: ID!) {
    deleteProjectV2(input: { projectId: $projectId }) {
      clientMutationId
    }
  }
`;

export const DELETE_PROJECT_ITEM_MUTATION = `
  mutation DeleteProjectItem($itemId: ID!, $projectId: ID!) {
    deleteProjectV2Item(input: { itemId: $itemId, projectId: $projectId }) {
      clientMutationId
    }
  }
`;

export const UPDATE_PROJECT_ITEM_MUTATION = `
  mutation UpdateProjectItem($itemId: ID!, $title: String, $body: String) {
    updateProjectV2DraftIssue(
      input: {
        draftIssueId: $itemId,
        title: $title,
        body: $body
      }
    ) {
      draftIssue {
        id
        title
        body
      }
    }
  }
`;
```

### 2. Project Edit Service

Create a new file `src/services/project-edit-service.ts`:

```typescript
import { GraphQLClient } from '../utils/graphql-client';
import { UPDATE_PROJECT_MUTATION, UPDATE_PROJECT_ITEM_MUTATION } from './graphql/mutations';

export class ProjectEditService {
  constructor(private graphqlClient: GraphQLClient) {}
  
  /**
   * Edit a GitHub Project
   * @param projectId Project ID
   * @param updates Project updates
   * @returns Updated project
   */
  async editProject(projectId: string, updates: {
    title?: string;
    description?: string;
    public?: boolean;
  }) {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('At least one update field is required');
    }
    
    const response = await this.graphqlClient.request(
      UPDATE_PROJECT_MUTATION,
      {
        projectId,
        title: updates.title,
        description: updates.description,
        public: updates.public
      }
    );
    
    if (response.errors) {
      throw new Error(`GraphQL Error: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return response.data.updateProjectV2.projectV2;
  }
  
  /**
   * Edit a GitHub Project item
   * @param itemId Item ID
   * @param updates Item updates
   * @returns Updated item
   */
  async editProjectItem(itemId: string, updates: {
    title?: string;
    body?: string;
  }) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('At least one update field is required');
    }
    
    const response = await this.graphqlClient.request(
      UPDATE_PROJECT_ITEM_MUTATION,
      {
        itemId,
        title: updates.title,
        body: updates.body
      }
    );
    
    if (response.errors) {
      throw new Error(`GraphQL Error: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return response.data.updateProjectV2DraftIssue.draftIssue;
  }
}
```

### 3. Project Delete Service

Create a new file `src/services/project-delete-service.ts`:

```typescript
import { GraphQLClient } from '../utils/graphql-client';
import { DELETE_PROJECT_MUTATION, DELETE_PROJECT_ITEM_MUTATION } from './graphql/mutations';

export class ProjectDeleteService {
  constructor(private graphqlClient: GraphQLClient) {}
  
  /**
   * Delete a GitHub Project
   * @param projectId Project ID
   * @returns Success status
   */
  async deleteProject(projectId: string) {
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    const response = await this.graphqlClient.request(
      DELETE_PROJECT_MUTATION,
      { projectId }
    );
    
    if (response.errors) {
      throw new Error(`GraphQL Error: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return { success: true, projectId };
  }
  
  /**
   * Delete a GitHub Project item
   * @param itemId Item ID
   * @param projectId Project ID
   * @returns Success status
   */
  async deleteProjectItem(itemId: string, projectId: string) {
    if (!itemId) {
      throw new Error('Item ID is required');
    }
    
    if (!projectId) {
      throw new Error('Project ID is required');
    }
    
    const response = await this.graphqlClient.request(
      DELETE_PROJECT_ITEM_MUTATION,
      { itemId, projectId }
    );
    
    if (response.errors) {
      throw new Error(`GraphQL Error: ${response.errors.map(e => e.message).join(', ')}`);
    }
    
    return { success: true, itemId };
  }
}
```

### 4. MCP Tool Handlers

Modify `src/mcp/tool-handlers.ts` to add new handlers:

```typescript
// Add these handlers to the existing file

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
  } catch (error) {
    throw new Error(`Failed to update project: ${error.message}`);
  }
}

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
  } catch (error) {
    throw new Error(`Failed to delete project: ${error.message}`);
  }
}

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
  } catch (error) {
    throw new Error(`Failed to update project item: ${error.message}`);
  }
}

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
  } catch (error) {
    throw new Error(`Failed to delete project item: ${error.message}`);
  }
}
```

### 5. Tool Registration

Modify `src/mcp/tools-registry.ts` to register new tools:

```typescript
// Add these tool definitions to the existing registry

const editProjectTool = {
  name: 'editProject',
  description: 'Edit an existing project',
  parameters: {
    projectId: {
      type: 'string',
      description: 'ID of the project to edit'
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

const deleteProjectTool = {
  name: 'deleteProject',
  description: 'Delete a project',
  parameters: {
    projectId: {
      type: 'string',
      description: 'ID of the project to delete'
    }
  },
  handler: handleDeleteProjectTool
};

const editProjectItemTool = {
  name: 'editProjectItem',
  description: 'Edit a project item',
  parameters: {
    itemId: {
      type: 'string',
      description: 'ID of the item to edit'
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

const deleteProjectItemTool = {
  name: 'deleteProjectItem',
  description: 'Delete an item from a project',
  parameters: {
    itemId: {
      type: 'string',
      description: 'ID of the item to delete'
    },
    projectId: {
      type: 'string',
      description: 'ID of the project containing the item'
    }
  },
  handler: handleDeleteProjectItemTool
};

// Add tools to the registry
export const toolsRegistry = [
  // ... existing tools
  editProjectTool,
  deleteProjectTool,
  editProjectItemTool,
  deleteProjectItemTool
];
```

### 6. SSE Event Emitter

Modify `src/sse/event-emitter.ts` to add new event types:

```typescript
// Add these methods to the existing SSE event emitter

/**
 * Emit a project updated event
 * @param project The updated project
 */
emitProjectUpdated(project) {
  this.emit('project_updated', {
    type: 'project_updated',
    project: project
  });
}

/**
 * Emit a project deleted event
 * @param projectId The deleted project ID
 */
emitProjectDeleted(projectId) {
  this.emit('project_deleted', {
    type: 'project_deleted',
    projectId: projectId
  });
}

/**
 * Emit a project item updated event
 * @param item The updated item
 */
emitProjectItemUpdated(item) {
  this.emit('project_item_updated', {
    type: 'project_item_updated',
    item: item
  });
}

/**
 * Emit a project item deleted event
 * @param itemId The deleted item ID
 * @param projectId The project ID
 */
emitProjectItemDeleted(itemId, projectId) {
  this.emit('project_item_deleted', {
    type: 'project_item_deleted',
    itemId: itemId,
    projectId: projectId
  });
}
```

### 7. HTTP MCP Server Integration

Modify `simple-mcp-server.js` to integrate new services:

```javascript
// Add these imports
const { ProjectEditService } = require('./services/project-edit-service');
const { ProjectDeleteService } = require('./services/project-delete-service');

// Initialize services
const projectEditService = new ProjectEditService(graphqlClient);
const projectDeleteService = new ProjectDeleteService(graphqlClient);

// Add services to context
const context = {
  services: {
    // ... existing services
    projectEditService,
    projectDeleteService,
    sseEmitter
  }
};

// Register new tools
server.tool(
  'editProject',
  {
    projectId: z.string().describe('ID of the project to edit'),
    title: z.string().optional().describe('New title for the project'),
    description: z.string().optional().describe('New description for the project'),
    public: z.boolean().optional().describe('Whether the project should be public')
  },
  async (args) => {
    try {
      const updatedProject = await projectEditService.editProject(args.projectId, {
        title: args.title,
        description: args.description,
        public: args.public
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
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  'deleteProject',
  {
    projectId: z.string().describe('ID of the project to delete')
  },
  async (args) => {
    try {
      const result = await projectDeleteService.deleteProject(args.projectId);
      
      // Emit SSE event for project deletion
      if (sseEmitter) {
        sseEmitter.emitProjectDeleted(args.projectId);
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
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  'editProjectItem',
  {
    itemId: z.string().describe('ID of the item to edit'),
    title: z.string().optional().describe('New title for the item'),
    body: z.string().optional().describe('New body content for the item')
  },
  async (args) => {
    try {
      const updatedItem = await projectEditService.editProjectItem(args.itemId, {
        title: args.title,
        body: args.body
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
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  'deleteProjectItem',
  {
    itemId: z.string().describe('ID of the item to delete'),
    projectId: z.string().describe('ID of the project containing the item')
  },
  async (args) => {
    try {
      const result = await projectDeleteService.deleteProjectItem(args.itemId, args.projectId);
      
      // Emit SSE event for project item deletion
      if (sseEmitter) {
        sseEmitter.emitProjectItemDeleted(args.itemId, args.projectId);
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
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);
```

### 8. STDIO MCP Server Integration

Modify `mcp-stdio-server.js` to integrate new services:

```javascript
// Add these imports
const { ProjectEditService } = require('./services/project-edit-service');
const { ProjectDeleteService } = require('./services/project-delete-service');

// Initialize services
const projectEditService = new ProjectEditService(graphqlClient);
const projectDeleteService = new ProjectDeleteService(graphqlClient);

// Add new tools
server.tool(
  'editProject',
  {
    projectId: z.string().describe('ID of the project to edit'),
    title: z.string().optional().describe('New title for the project'),
    description: z.string().optional().describe('New description for the project'),
    public: z.boolean().optional().describe('Whether the project should be public')
  },
  async (args) => {
    try {
      const updatedProject = await projectEditService.editProject(args.projectId, {
        title: args.title,
        description: args.description,
        public: args.public
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(updatedProject, null, 2)
          }
        ],
        project: updatedProject
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  'deleteProject',
  {
    projectId: z.string().describe('ID of the project to delete')
  },
  async (args) => {
    try {
      const result = await projectDeleteService.deleteProject(args.projectId);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  'editProjectItem',
  {
    itemId: z.string().describe('ID of the item to edit'),
    title: z.string().optional().describe('New title for the item'),
    body: z.string().optional().describe('New body content for the item')
  },
  async (args) => {
    try {
      const updatedItem = await projectEditService.editProjectItem(args.itemId, {
        title: args.title,
        body: args.body
      });
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(updatedItem, null, 2)
          }
        ],
        item: updatedItem
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);

server.tool(
  'deleteProjectItem',
  {
    itemId: z.string().describe('ID of the item to delete'),
    projectId: z.string().describe('ID of the project containing the item')
  },
  async (args) => {
    try {
      const result = await projectDeleteService.deleteProjectItem(args.itemId, args.projectId);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ],
        result
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }
);
```

### 9. MCP Discovery Update

Update the MCP discovery endpoint in `simple-mcp-server.js`:

```javascript
// Update the capabilities section in the discovery endpoint
app.get('/.well-known/mcp.json', (req, res) => {
  const discovery = {
    version: "2025-03-26",
    name: "github-projects-mcp",
    description: "GitHub Projects API with GraphQL and REST support",
    vendor: "Edge Agents",
    contact: {
      name: "Edge Agents Team",
      url: "https://github.com/agenticsorg/edge-agents"
    },
    authentication: {
      type: "none"
    },
    capabilities: {
      tools: {
        getRepository: {
          description: "Get repository information from GitHub"
        },
        listProjects: {
          description: "List GitHub Projects v2 for an organization"
        },
        getProject: {
          description: "Get detailed information about a GitHub Project"
        },
        createProject: {
          description: "Create a new GitHub Project in an organization"
        },
        createProjectItem: {
          description: "Create a new item in a GitHub Project"
        },
        getProjectItems: {
          description: "Get items from a GitHub Project"
        },
        executeGraphQL: {
          description: "Execute a custom GraphQL query against the GitHub API"
        },
        // Add new capabilities
        editProject: {
          description: "Edit an existing GitHub Project"
        },
        deleteProject: {
          description: "Delete a GitHub Project"
        },
        editProjectItem: {
          description: "Edit an item in a GitHub Project"
        },
        deleteProjectItem: {
          description: "Delete an item from a GitHub Project"
        }
      }
    }
  };
  
  res.json(discovery);
});
```

### 10. Documentation

Create a new file `docs/edit-delete-api.md`:

```markdown
# GitHub Projects Edit and Delete API

This document describes the edit and delete capabilities of the GitHub Projects API.

## Edit Project

Edit an existing GitHub Project.

### Tool: `editProject`

#### Parameters

- `projectId` (string, required): ID of the project to edit
- `title` (string, optional): New title for the project
- `description` (string, optional): New description for the project
- `public` (boolean, optional): Whether the project should be public

#### Example

```javascript
const result = await mcpClient.callTool('editProject', {
  projectId: 'PVT_kwDOC6dDnM4A2KkE',
  title: 'Updated Project Title',
  description: 'Updated project description'
});
```

## Delete Project

Delete a GitHub Project.

### Tool: `deleteProject`

#### Parameters

- `projectId` (string, required): ID of the project to delete

#### Example

```javascript
const result = await mcpClient.callTool('deleteProject', {
  projectId: 'PVT_kwDOC6dDnM4A2KkE'
});
```

## Edit Project Item

Edit an item in a GitHub Project.

### Tool: `editProjectItem`

#### Parameters

- `itemId` (string, required): ID of the item to edit
- `title` (string, optional): New title for the item
- `body` (string, optional): New body content for the item

#### Example

```javascript
const result = await mcpClient.callTool('editProjectItem', {
  itemId: 'PVTI_lADOABCD123',
  title: 'Updated Item Title',
  body: 'Updated item description'
});
```

## Delete Project Item

Delete an item from a GitHub Project.

### Tool: `deleteProjectItem`

#### Parameters

- `itemId` (string, required): ID of the item to delete
- `projectId` (string, required): ID of the project containing the item

#### Example

```javascript
const result = await mcpClient.callTool('deleteProjectItem', {
  itemId: 'PVTI_lADOABCD123',
  projectId: 'PVT_kwDOC6dDnM4A2KkE'
});
```

## SSE Events

The following SSE events are emitted for edit and delete operations:

- `project_updated`: Emitted when a project is updated
- `project_deleted`: Emitted when a project is deleted
- `project_item_updated`: Emitted when a project item is updated
- `project_item_deleted`: Emitted when a project item is deleted
```

## Testing Strategy

### Unit Tests

1. Test each service method in isolation
2. Test tool handlers with mocked services
3. Test SSE event emitter

### Integration Tests

1. Test HTTP MCP server with real HTTP requests
2. Test STDIO MCP server with child process communication
3. Test SSE events with real event listeners

### End-to-End Tests

1. Test complete project lifecycle (create, edit, delete)
2. Test with both HTTP and STDIO MCP servers

## Dependencies and Timeline

### Dependencies

1. GraphQL client implementation
2. Existing MCP server infrastructure
3. Existing SSE event system

### Timeline

- **Days 1-2**: Core Service Layer
- **Days 3-4**: MCP Tool Handlers
- **Days 5-6**: SSE Event System
- **Days 7-8**: Integration
- **Days 9-10**: Documentation and Finalization

## Conclusion

