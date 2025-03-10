#!/usr/bin/env deno run --allow-env --allow-read

// TypeScript declarations for Deno
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  }
  
  export const env: Env;
  
  export interface StatOptions {
    isFile?: boolean;
    isDirectory?: boolean;
    isSymlink?: boolean;
    size?: number;
    mtime?: Date;
    atime?: Date;
    birthtime?: Date;
    dev?: number;
    ino?: number;
    mode?: number;
    nlink?: number;
    uid?: number;
    gid?: number;
    rdev?: number;
    blksize?: number;
    blocks?: number;
  }
  
  export interface StatResult {
    isFile: boolean;
    isDirectory: boolean;
    isSymlink: boolean;
    size: number;
    mtime: Date | null;
    atime: Date | null;
    birthtime: Date | null;
    dev: number;
    ino: number;
    mode: number;
    nlink: number;
    uid: number;
    gid: number;
    rdev: number;
    blksize: number;
    blocks: number;
  }
  
  export function stat(path: string): Promise<StatResult>;
  
  export namespace errors {
    export class NotFound extends Error {}
  }
  
  export function exit(code?: number): never;
}

// Import dotenv to load environment variables from .env file
import "jsr:@std/dotenv/load";

/**
 * Environment Variables Testing Utility
 * 
 * This utility checks for required environment variables and provides
 * feedback on missing variables. It looks for variables in the following
 * locations:
 * 
 * 1. /workspaces/agentics/agentic.env (project root placeholder)
 * 2. Local .env files in the functions directory
 * 3. Environment variables loaded via the --env-file flag
 */

// Define required environment variables
const REQUIRED_VARS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_PROJECT_ID",
  "MCP_SECRET_KEY"
];

// Function to check if environment variables are set
function checkEnvironmentVariables() {
  console.log("Checking environment variables...");
  
  const missingVars: string[] = [];
  
  for (const varName of REQUIRED_VARS) {
    const value = Deno.env.get(varName);
    if (!value) {
      missingVars.push(varName);
    } else {
      // Mask sensitive values when printing
      const maskedValue = varName.includes("KEY") || varName.includes("SECRET") 
        ? value.substring(0, 4) + "..." + value.substring(value.length - 4)
        : value;
      console.log(`✅ ${varName}: ${maskedValue}`);
    }
  }
  
  if (missingVars.length > 0) {
    console.error("\n❌ Missing required environment variables:");
    for (const varName of missingVars) {
      console.error(`   - ${varName}`);
    }
    console.error("\nPlease add these variables to your .env file or provide them via --env-file flag.");
    console.error("Example: deno run --env-file=/workspaces/agentics/agentic.env --allow-env --allow-read env_test.ts");
    Deno.exit(1);
  } else {
    console.log("\n✅ All required environment variables are set!");
  }
}

// Main function
async function main() {
  console.log("Environment Variables Testing Utility");
  console.log("=====================================");
  
  // Check if agentic.env exists in the project root
  try {
    const agenticEnvPath = "/workspaces/agentics/agentic.env";
    await Deno.stat(agenticEnvPath);
    console.log(`Found agentic.env at ${agenticEnvPath}`);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.warn("Warning: agentic.env not found in project root.");
      console.warn("You may need to create this file with your environment variables.");
    } else {
      console.error(`Error checking for agentic.env: ${error.message}`);
    }
  }
  
  // Check environment variables
  checkEnvironmentVariables();
  
  console.log("\nEnvironment variable loading methods in Deno:");
  console.log("1. Using --env-file flag (recommended):");
  console.log("   deno run --env-file=/workspaces/agentics/agentic.env --allow-env your_script.ts");
  
  console.log("\n2. Auto-loading with JSR module:");
  console.log('   import "jsr:@std/dotenv/load";');
  console.log('   console.log(Deno.env.get("VARIABLE_NAME"));');
  
  console.log("\n3. Manual loading with JSR module:");
  console.log('   import { load } from "jsr:@std/dotenv/mod.ts";');
  console.log('   const env = await load({ path: "/workspaces/agentics/agentic.env" });');
  console.log('   console.log(env.VARIABLE_NAME);');
}

// Run the main function
main().catch(error => {
  console.error(`Error: ${error.message}`);
  Deno.exit(1);
});