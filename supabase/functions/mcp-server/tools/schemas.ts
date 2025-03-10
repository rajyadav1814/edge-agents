// tools/schemas.ts

// Database query tool schema
export const databaseQuerySchema = {
  type: 'object',
  properties: {
    table: {
      type: 'string',
      description: 'Table name',
    },
    query: {
      type: 'string',
      description: 'SQL query to execute',
    },
    limit: {
      type: 'number',
      description: 'Maximum number of results to return',
    },
  },
  required: ['table'],
};

// Messaging tool schema
export const sendMessageSchema = {
  type: 'object',
  properties: {
    agent: {
      type: 'string',
      description: 'Agent name',
    },
    message: {
      type: 'string',
      description: 'Message content',
    },
  },
  required: ['agent', 'message'],
};

// System info tool schema
export const systemInfoSchema = {
  type: 'object',
  properties: {
    type: {
      type: 'string',
      description: 'Type of system information to retrieve',
      enum: ['memory', 'cpu', 'disk', 'network', 'all'],
    },
  },
  required: ['type'],
};