// resources/handlers/database.ts
import { createClient } from '@supabase/supabase-js';
import { ResourceHandler, ResourceTemplateHandler } from '../registry.ts';
import { McpError, ErrorCode } from 'https://esm.sh/@modelcontextprotocol/sdk/types.js';

// Get environment variables
// @ts-ignore - Deno is available in Supabase Edge Functions
const SUPABASE_URL = (Deno as any).env.get('SUPABASE_URL') || '';
// @ts-ignore - Deno is available in Supabase Edge Functions
const SUPABASE_KEY = (Deno as any).env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Database table resource handler
async function handleDatabaseTable(uri: string): Promise<any> {
  // Extract table name from URI
  const match = uri.match(/^supabase:\/\/database\/([^\/]+)$/);
  if (!match) {
    throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${uri}`);
  }
  
  const tableName = match[1];
  
  try {
    // Query the Supabase table
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(100);
      
    if (error) throw new Error(error.message);
    
    return data;
  } catch (error: any) {
    throw new McpError(ErrorCode.InternalError, `Error accessing database table: ${error.message}`);
  }
}

// Database row resource handler
async function handleDatabaseRow(uri: string): Promise<any> {
  // Extract table name and row ID from URI
  const match = uri.match(/^supabase:\/\/database\/([^\/]+)\/([^\/]+)$/);
  if (!match) {
    throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${uri}`);
  }
  
  const tableName = match[1];
  const rowId = match[2];
  
  try {
    // Query the Supabase table for the specific row
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', rowId)
      .single();
      
    if (error) throw new Error(error.message);
    
    return data;
  } catch (error: any) {
    throw new McpError(ErrorCode.InternalError, `Error accessing database row: ${error.message}`);
  }
}

// Export database resources
export const databaseResources: ResourceHandler[] = [
  {
    uri: 'supabase://database/users',
    name: 'Supabase Users',
    mimeType: 'application/json',
    description: 'Access to Supabase users table',
    handler: handleDatabaseTable
  },
  {
    uri: 'supabase://database/profiles',
    name: 'Supabase Profiles',
    mimeType: 'application/json',
    description: 'Access to Supabase profiles table',
    handler: handleDatabaseTable
  }
];

// Export database resource templates
export const databaseResourceTemplates: ResourceTemplateHandler[] = [
  {
    uriTemplate: 'supabase://database/{table}',
    name: 'Supabase Database Table',
    mimeType: 'application/json',
    description: 'Access to a Supabase database table',
    handler: handleDatabaseTable
  },
  {
    uriTemplate: 'supabase://database/{table}/{id}',
    name: 'Supabase Database Row',
    mimeType: 'application/json',
    description: 'Access to a specific row in a Supabase database table',
    handler: handleDatabaseRow
  }
];