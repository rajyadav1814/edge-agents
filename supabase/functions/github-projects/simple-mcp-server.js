/**
 * MCP HTTP server for GitHub Projects API
 * 
 * This server implements the Model Context Protocol (MCP) using the official SDK.
 * It provides tools for interacting with GitHub repositories and projects.
 */

const express = require('express');
const http = require('node:http');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { SSEServerTransport } = require('@modelcontextprotocol/sdk/server/sse.js');
const z = require('zod');

// Server configuration
const PORT = 8002;

// Create an MCP server
const server = new McpServer({
  name: 'github-projects-mcp',
  version: '1.0.0'
});

// Add getRepository tool
server.tool(
  'getRepository',
  {
    owner: z.string().describe('Repository owner'),
    repo: z.string().describe('Repository name')
  },
  async ({ owner, repo }) => {
    try {
      // Mock repository data
      const repoData = {
        name: repo,
        owner: {
          login: owner
        },
        description: "Repository description",
        url: `https://github.com/${owner}/${repo}`,
        html_url: `https://github.com/${owner}/${repo}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        stargazers_count: 42,
        forks_count: 10,
        open_issues_count: 5
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(repoData, null, 2)
          }
        ],
        repository: repoData
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

// Add listProjects tool
server.tool(
  'listProjects',
  {
    organization: z.string().describe('Organization name'),
    limit: z.number().optional().default(10).describe('Maximum number of projects to return')
  },
  async ({ organization, limit }) => {
    try {
      // Mock projects data
      const projects = [
        {
          id: "proj_1",
          title: "Project 1",
          number: 1,
          shortDescription: "First project",
          public: true,
          url: `https://github.com/orgs/${organization}/projects/1`,
          closed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: "proj_2",
          title: "Project 2",
          number: 2,
          shortDescription: "Second project",
          public: true,
          url: `https://github.com/orgs/${organization}/projects/2`,
          closed: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(projects, null, 2)
          }
        ],
        projects: projects
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

// Add getProject tool
server.tool(
  'getProject',
  {
    organization: z.string().describe('Organization name'),
    projectNumber: z.number().describe('Project number')
  },
  async ({ organization, projectNumber }) => {
    try {
      // Mock project data
      const project = {
        id: `proj_${projectNumber}`,
        title: `Project ${projectNumber}`,
        number: projectNumber,
        shortDescription: `Project ${projectNumber} description`,
        public: true,
        url: `https://github.com/orgs/${organization}/projects/${projectNumber}`,
        closed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        fields: {
          nodes: []
        }
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(project, null, 2)
          }
        ],
        project: project
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

// Add createProject tool
server.tool(
  'createProject',
  {
    organization: z.string().describe('Organization name'),
    title: z.string().describe('Project title'),
    shortDescription: z.string().optional().describe('Project description')
  },
  async ({ organization, title, shortDescription }) => {
    try {
      // Mock create project response
      const project = {
        id: "proj_new",
        title: title,
        number: 99,
        shortDescription: shortDescription || "",
        url: `https://github.com/orgs/${organization}/projects/99`,
        createdAt: new Date().toISOString()
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(project, null, 2)
          }
        ],
        project: project
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

// Add createProjectItem tool
server.tool(
  'createProjectItem',
  {
    projectId: z.string().describe('Project ID'),
    title: z.string().describe('Item title'),
    body: z.string().optional().describe('Item body/description')
  },
  async ({ projectId, title, body }) => {
    try {
      // Mock create project item response
      const item = {
        id: "item_new",
        databaseId: 12345,
        type: "DRAFT_ISSUE",
        content: {
          id: "draft_1",
          title: title,
          body: body || ""
        }
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(item, null, 2)
          }
        ],
        item: item
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

// Add getProjectItems tool
server.tool(
  'getProjectItems',
  {
    projectId: z.string().describe('Project ID'),
    limit: z.number().optional().default(20).describe('Maximum number of items to return')
  },
  async ({ projectId, limit }) => {
    try {
      // Mock project items data
      const items = [
        {
          id: "item_1",
          content: {
            id: "draft_1",
            title: "Item 1",
            body: "Item 1 description"
          }
        },
        {
          id: "item_2",
          content: {
            id: "draft_2",
            title: "Item 2",
            body: "Item 2 description"
          }
        }
      ];
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(items, null, 2)
          }
        ],
        items: items
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

// Add executeGraphQL tool
server.tool(
  'executeGraphQL',
  {
    query: z.string().describe('GraphQL query'),
    variables: z.record(z.any()).optional().describe('Query variables')
  },
  async ({ query, variables }) => {
    try {
      // Mock GraphQL response
      const data = {
        data: {
          message: "GraphQL query executed successfully",
          query: query
        }
      };
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(data, null, 2)
          }
        ],
        response: data
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

// Create Express app
const app = express();

// Add CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  
  next();
});

// Add body parsing middleware
app.use(express.json());

// Set up MCP discovery endpoint
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
        }
      }
    }
  };
  
  res.json(discovery);
});

// Set up SSE endpoint
const transports = {};

app.get('/sse', async (req, res) => {
  console.log('SSE connection established');
  const transport = new SSEServerTransport('/messages', res);
  transports[transport.sessionId] = transport;
  
  res.on('close', () => {
    console.log(`SSE connection closed: ${transport.sessionId}`);
    delete transports[transport.sessionId];
  });
  
  await server.connect(transport);
});

app.post('/messages', async (req, res) => {
  const sessionId = req.query.sessionId;
  const transport = transports[sessionId];
  
  if (transport) {
    await transport.handlePostMessage(req, res);
  } else {
    res.status(400).send('No transport found for sessionId');
  }
});

// Add direct tool endpoints for compatibility with the previous implementation
app.get('/tools/list', (req, res) => {
  const tools = [
    {
      name: "getRepository",
      description: "Get repository information",
      inputSchema: {
        type: "object",
        properties: {
          owner: { type: "string" },
          repo: { type: "string" }
        },
        required: ["owner", "repo"]
      }
    },
    {
      name: "listProjects",
      description: "List projects for an organization",
      inputSchema: {
        type: "object",
        properties: {
          organization: { type: "string" },
          limit: { type: "number", default: 10 }
        },
        required: ["organization"]
      }
    },
    {
      name: "getProject",
      description: "Get project details",
      inputSchema: {
        type: "object",
        properties: {
          organization: { type: "string" },
          projectNumber: { type: "number" }
        },
        required: ["organization", "projectNumber"]
      }
    },
    {
      name: "createProject",
      description: "Create a new GitHub Project in an organization",
      inputSchema: {
        type: "object",
        properties: {
          organization: { type: "string" },
          title: { type: "string" },
          shortDescription: { type: "string" }
        },
        required: ["organization", "title"]
      }
    },
    {
      name: "createProjectItem",
      description: "Create a new item in a GitHub Project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          title: { type: "string" },
          body: { type: "string" }
        },
        required: ["projectId", "title"]
      }
    },
    {
      name: "getProjectItems",
      description: "Get items from a GitHub Project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "string" },
          limit: { type: "number", default: 20 }
        },
        required: ["projectId"]
      }
    },
    {
      name: "executeGraphQL",
      description: "Execute a GraphQL query against the GitHub API",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
          variables: { type: "object" }
        },
        required: ["query"]
      }
    }
  ];
  
  res.json({ tools });
});

app.post('/tools/call', async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    
    if (!name) {
      res.status(400).json({ error: 'Tool name is required' });
      return;
    }
    
    let result;
    
    // Call the appropriate tool handler directly
    if (name === 'getRepository') {
      result = await server.tool('getRepository', args);
    } else if (name === 'listProjects') {
      result = await server.tool('listProjects', args);
    } else if (name === 'getProject') {
      result = await server.tool('getProject', args);
    } else if (name === 'createProject') {
      result = await server.tool('createProject', args);
    } else if (name === 'createProjectItem') {
      result = await server.tool('createProjectItem', args);
    } else if (name === 'getProjectItems') {
      result = await server.tool('getProjectItems', args);
    } else if (name === 'executeGraphQL') {
      result = await server.tool('executeGraphQL', args);
    } else {
      res.status(404).json({ error: `Tool '${name}' not found` });
      return;
    }
    
    res.json({
      content: [
        {
          type: "text",
          text: JSON.stringify(result)
        }
      ]
    });
  } catch (error) {
    res.status(400).json({ error: `Error executing tool: ${error.message}` });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`GitHub Projects MCP server running at http://localhost:${PORT}`);
  console.log(`MCP Discovery endpoint: http://localhost:${PORT}/.well-known/mcp.json`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Direct tools endpoint: http://localhost:${PORT}/tools/call`);
});

// Handle process exit
process.on('SIGINT', () => {
  console.log('Shutting down MCP server...');
  process.exit(0);
});