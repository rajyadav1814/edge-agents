// resources/handlers/storage.ts
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

// Storage bucket resource handler
async function handleStorageBucket(uri: string): Promise<any> {
  // Extract bucket name from URI
  const match = uri.match(/^supabase:\/\/storage\/([^\/]+)$/);
  if (!match) {
    throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${uri}`);
  }
  
  const bucketName = match[1];
  
  try {
    // List files in the bucket
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .list();
      
    if (error) throw new Error(error.message);
    
    return data;
  } catch (error: any) {
    throw new McpError(ErrorCode.InternalError, `Error accessing storage bucket: ${error.message}`);
  }
}

// Storage file resource handler
async function handleStorageFile(uri: string): Promise<any> {
  // Extract bucket name and file path from URI
  const match = uri.match(/^supabase:\/\/storage\/([^\/]+)\/(.+)$/);
  if (!match) {
    throw new McpError(ErrorCode.InvalidRequest, `Invalid URI format: ${uri}`);
  }
  
  const bucketName = match[1];
  const filePath = match[2];
  
  try {
    // Get the file
    const { data, error } = await supabase
      .storage
      .from(bucketName)
      .download(filePath);
      
    if (error) throw new Error(error.message);
    
    // Convert the file to text
    const text = await data.text();
    
    return text;
  } catch (error: any) {
    throw new McpError(ErrorCode.InternalError, `Error accessing storage file: ${error.message}`);
  }
}

// Export storage resources
export const storageResources: ResourceHandler[] = [
  {
    uri: 'supabase://storage/public',
    name: 'Supabase Public Storage',
    mimeType: 'application/json',
    description: 'Access to Supabase public storage bucket',
    handler: handleStorageBucket
  }
];

// Export storage resource templates
export const storageResourceTemplates: ResourceTemplateHandler[] = [
  {
    uriTemplate: 'supabase://storage/{bucket}',
    name: 'Supabase Storage Bucket',
    mimeType: 'application/json',
    description: 'Access to a Supabase storage bucket',
    handler: handleStorageBucket
  },
  {
    uriTemplate: 'supabase://storage/{bucket}/{path}',
    name: 'Supabase Storage File',
    mimeType: 'text/plain',
    description: 'Access to a file in a Supabase storage bucket',
    handler: handleStorageFile
  }
];