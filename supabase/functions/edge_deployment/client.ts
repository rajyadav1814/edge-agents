#!/usr/bin/env deno run --allow-net --allow-env --allow-read

/**
 * Edge Deployment Client
 * 
 * A command-line client for interacting with the Edge Deployment function.
 * This script can be used to list, create, update, and delete Edge Functions.
 * 
 * Usage:
 *   deno run --allow-net --allow-env --allow-read client.ts [command] [options]
 * 
 * Commands:
 *   list                     List all Edge Functions
 *   get [slug]               Get details of a specific Edge Function
 *   body [slug]              Get the body of a specific Edge Function
 *   create [options]         Create a new Edge Function
 *   update [options]         Update an existing Edge Function
 *   delete [slug]            Delete an Edge Function
 *   help                     Show this help information
 * 
 * Options for create:
 *   --slug [slug]            Function slug (required)
 *   --name [name]            Function name (required)
 *   --file [path]            Path to the function code file (required)
 *   --verify-jwt             Whether to verify JWT (optional)
 * 
 * Options for update:
 *   --slug [slug]            Function slug (required)
 *   --name [name]            Function name (optional)
 *   --file [path]            Path to the function code file (optional)
 *   --verify-jwt             Whether to verify JWT (optional)
 *   --no-verify-jwt          Disable JWT verification (optional)
 * 
 * Environment Variables:
 *   SUPABASE_URL             Your Supabase project URL
 *   VITE_SUPABASE_PROJECT_ID Your Supabase project ID
 *   SUPABASE_SERVICE_KEY     Your Supabase service role key
 */

// Import required modules
import { parse } from "std/flags/mod.ts";

// Define the base URL for the Edge Deployment function
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const EDGE_DEPLOYMENT_URL = `${SUPABASE_URL}/functions/v1/edge_deployment`;

// Parse command-line arguments
const args = parse(Deno.args, {
  boolean: ["verify-jwt", "no-verify-jwt", "help"],
  string: ["slug", "name", "file"],
  alias: {
    h: "help",
    s: "slug",
    n: "name",
    f: "file",
    v: "verify-jwt",
  },
});

// Get the command from the arguments
const command = args._[0] || "help";

// Check if help is requested
if (args.help || command === "help") {
  showHelp();
  Deno.exit(0);
}

// Check required environment variables
if (!SUPABASE_URL) {
  console.error("Error: SUPABASE_URL environment variable is required");
  Deno.exit(1);
}

if (!Deno.env.get("VITE_SUPABASE_PROJECT_ID")) {
  console.error("Error: VITE_SUPABASE_PROJECT_ID environment variable is required");
  Deno.exit(1);
}

if (!Deno.env.get("SUPABASE_SERVICE_KEY")) {
  console.error("Error: SUPABASE_SERVICE_KEY environment variable is required");
  Deno.exit(1);
}

// Execute the command
try {
  switch (command) {
    case "list":
      await listFunctions();
      break;
    case "get":
      await getFunction(args._[1]);
      break;
    case "body":
      await getFunctionBody(args._[1]);
      break;
    case "create":
      await createFunction(args);
      break;
    case "update":
      await updateFunction(args);
      break;
    case "delete":
      await deleteFunction(args._[1]);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      Deno.exit(1);
  }
} catch (error: unknown) {
  console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
  Deno.exit(1);
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Edge Deployment Client

A command-line client for interacting with the Edge Deployment function.
This script can be used to list, create, update, and delete Edge Functions.

Usage:
  deno run --allow-net --allow-env --allow-read client.ts [command] [options]

Commands:
  list                     List all Edge Functions
  get [slug]               Get details of a specific Edge Function
  body [slug]              Get the body of a specific Edge Function
  create [options]         Create a new Edge Function
  update [options]         Update an existing Edge Function
  delete [slug]            Delete an Edge Function
  help                     Show this help information

Options for create:
  --slug [slug]            Function slug (required)
  --name [name]            Function name (required)
  --file [path]            Path to the function code file (required)
  --verify-jwt             Whether to verify JWT (optional)

Options for update:
  --slug [slug]            Function slug (required)
  --name [name]            Function name (optional)
  --file [path]            Path to the function code file (optional)
  --verify-jwt             Whether to verify JWT (optional)
  --no-verify-jwt          Disable JWT verification (optional)

Environment Variables:
  SUPABASE_URL             Your Supabase project URL
  VITE_SUPABASE_PROJECT_ID Your Supabase project ID
  SUPABASE_SERVICE_KEY     Your Supabase service role key
`);
}

/**
 * List all Edge Functions
 */
async function listFunctions() {
  const response = await fetch(`${EDGE_DEPLOYMENT_URL}/list`, {
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_KEY")}`,
    },
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message);
  }
  
  console.log(`Found ${result.data.count} Edge Functions:`);
  
  if (result.data.functions.length === 0) {
    console.log("No Edge Functions found.");
    return;
  }
  
  result.data.functions.forEach((func: any) => {
    console.log(`
Function: ${func.name} (${func.slug})
  Status: ${func.status}
  Version: ${func.version}
  Verify JWT: ${func.verify_jwt ? "Yes" : "No"}
  Created: ${new Date(func.created_at).toLocaleString()}
  Updated: ${new Date(func.updated_at).toLocaleString()}
`);
  });
}

/**
 * Get details of a specific Edge Function
 * @param slug Function slug
 */
async function getFunction(slug: string) {
  if (!slug) {
    throw new Error("Function slug is required");
  }
  
  const response = await fetch(`${EDGE_DEPLOYMENT_URL}/get/${slug}`, {
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_KEY")}`,
    },
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message);
  }
  
  const func = result.data;
  
  console.log(`
Function: ${func.name} (${func.slug})
  ID: ${func.id}
  Status: ${func.status}
  Version: ${func.version}
  Verify JWT: ${func.verify_jwt ? "Yes" : "No"}
  Import Map: ${func.import_map ? "Yes" : "No"}
  Created: ${new Date(func.created_at).toLocaleString()}
  Updated: ${new Date(func.updated_at).toLocaleString()}
  ${func.entrypoint_path ? `Entrypoint: ${func.entrypoint_path}` : ""}
  ${func.import_map_path ? `Import Map: ${func.import_map_path}` : ""}
`);
}

/**
 * Get the body of a specific Edge Function
 * @param slug Function slug
 */
async function getFunctionBody(slug: string) {
  if (!slug) {
    throw new Error("Function slug is required");
  }
  
  const response = await fetch(`${EDGE_DEPLOYMENT_URL}/body/${slug}`, {
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_KEY")}`,
    },
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message);
  }
  
  console.log(result.data);
}

/**
 * Create a new Edge Function
 * @param args Command-line arguments
 */
async function createFunction(args: any) {
  const { slug, name, file, "verify-jwt": verifyJwt } = args;
  
  if (!slug) {
    throw new Error("Function slug is required (--slug)");
  }
  
  if (!name) {
    throw new Error("Function name is required (--name)");
  }
  
  if (!file) {
    throw new Error("Function code file is required (--file)");
  }
  
  // Read the function code from the file
  let code;
  try {
    code = await Deno.readTextFile(file);
  } catch (error: unknown) {
    throw new Error(`Failed to read function code file: ${error instanceof Error ? error.message : String(error)}`);
  }
  
  const response = await fetch(`${EDGE_DEPLOYMENT_URL}/create`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slug,
      name,
      code,
      verify_jwt: verifyJwt,
    }),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message);
  }
  
  console.log(`Created function: ${slug}`);
}

/**
 * Update an existing Edge Function
 * @param args Command-line arguments
 */
async function updateFunction(args: any) {
  const { slug, name, file, "verify-jwt": verifyJwt, "no-verify-jwt": noVerifyJwt } = args;
  
  if (!slug) {
    throw new Error("Function slug is required (--slug)");
  }
  
  // Build the updates object
  const updates: Record<string, any> = {};
  
  if (name !== undefined) {
    updates.name = name;
  }
  
  if (file !== undefined) {
    // Read the function code from the file
    try {
      updates.code = await Deno.readTextFile(file);
    } catch (error: unknown) {
      throw new Error(`Failed to read function code file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  if (verifyJwt) {
    updates.verify_jwt = true;
  } else if (noVerifyJwt) {
    updates.verify_jwt = false;
  }
  
  // Check if there are any updates
  if (Object.keys(updates).length === 0) {
    throw new Error("No updates specified");
  }
  
  const response = await fetch(`${EDGE_DEPLOYMENT_URL}/update`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      slug,
      ...updates,
    }),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message);
  }
  
  console.log(`Updated function: ${slug}`);
}

/**
 * Delete an Edge Function
 * @param slug Function slug
 */
async function deleteFunction(slug: string) {
  if (!slug) {
    throw new Error("Function slug is required");
  }
  
  const response = await fetch(`${EDGE_DEPLOYMENT_URL}/delete/${slug}`, {
    headers: {
      "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_KEY")}`,
    },
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.message);
  }
  
  console.log(`Deleted function: ${slug}`);
}
