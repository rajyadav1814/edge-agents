// tools/handlers/database.ts
import { createClient } from '@supabase/supabase-js';
import { databaseQuerySchema } from '../schemas.ts';
import { ToolHandler } from '../registry.ts';

// Get environment variables
// @ts-ignore - Deno is available in Supabase Edge Functions
const SUPABASE_URL = (Deno as any).env.get('SUPABASE_URL') || '';
// @ts-ignore - Deno is available in Supabase Edge Functions
const SUPABASE_KEY = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Query database handler
async function queryDatabase(args: any): Promise<any> {
  const { table, query, limit = 100 } = args;
  
  try {
    let queryBuilder = supabase.from(table).select('*');
    
    if (query) {
      // For simplicity, we're not executing raw SQL queries
      // In a real implementation, you would need to sanitize and validate the query
      if (query.includes('where')) {
        const whereClause = query.split('where')[1].trim();
        // This is a simplified approach and not secure for production
        const parts = whereClause.split('=');
        if (parts.length === 2) {
          const column = parts[0].trim();
          const value = parts[1].trim().replace(/'/g, '');
          queryBuilder = queryBuilder.eq(column, value);
        }
      }
    }
    
    const { data, error } = await queryBuilder.limit(limit);
    
    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (error) {
    throw new Error(`Database query error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Insert data handler
async function insertData(args: any): Promise<any> {
  const { table, data } = args;
  
  try {
    const { data: result, error } = await supabase
      .from(table)
      .insert(data)
      .select();
    
    if (error) {
      throw new Error(error.message);
    }

    return result;
  } catch (error) {
    throw new Error(`Database insert error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Update data handler
async function updateData(args: any): Promise<any> {
  const { table, data, match } = args;
  
  try {
    let query = supabase
      .from(table)
      .update(data);
    
    // Apply match conditions
    if (match) {
      for (const key in match) {
        if (Object.prototype.hasOwnProperty.call(match, key)) {
          query = query.eq(key, match[key]);
        }
      }
    }
    
    const { data: result, error } = await query.select();
    
    if (error) {
      throw new Error(error.message);
    }

    return result;
  } catch (error) {
    throw new Error(`Database update error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Export all database tools
export const databaseTools: ToolHandler[] = [
  {
    name: 'query_database',
    description: 'Query the Supabase database',
    inputSchema: databaseQuerySchema,
    handler: queryDatabase
  },
  {
    name: 'insert_data',
    description: 'Insert data into the Supabase database',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name',
        },
        data: {
          type: 'object',
          description: 'Data to insert',
        },
      },
      required: ['table', 'data'],
    },
    handler: insertData
  },
  {
    name: 'update_data',
    description: 'Update data in the Supabase database',
    inputSchema: {
      type: 'object',
      properties: {
        table: {
          type: 'string',
          description: 'Table name',
        },
        data: {
          type: 'object',
          description: 'Data to update',
        },
        match: {
          type: 'object',
          description: 'Match conditions',
        },
      },
      required: ['table', 'data'],
    },
    handler: updateData
  }
];