#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env --allow-net

/**
 * SPARC 2.0 Agentic Benchmarking Suite
 * Main entry point
 */

import { runCli } from "./src/cli/cli.ts";

// Run CLI
runCli().catch(console.error);