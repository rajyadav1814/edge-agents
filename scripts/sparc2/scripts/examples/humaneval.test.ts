/**
 * HumanEval Test for SPARC2
 * 
 * This script demonstrates how to use SPARC2 to solve HumanEval problems.
 * HumanEval is a benchmark for evaluating code generation models.
 */

import { SPARC2Agent } from "../../src/agent/agent.ts";
import { readJsonLines } from "../../src/utils/file.ts";
import { join } from "https://deno.land/std/path/mod.ts";

// Path to the HumanEval dataset
const HUMANEVAL_PATH = join(Deno.cwd(), "data", "humaneval.jsonl");

/**
 * Run SPARC2 on a HumanEval problem
 * @param taskId The ID of the HumanEval task to run
 */
async function runHumanEvalTask(taskId: string) {
  console.log(`Running HumanEval task: ${taskId}`);
  
  // Read the HumanEval dataset
  const problems = await readJsonLines(HUMANEVAL_PATH);
  
  // Find the specified problem
  const problem = problems.find((p: any) => p.task_id === taskId);
  if (!problem) {
    console.error(`Problem ${taskId} not found in HumanEval dataset`);
    return;
  }
  
  // Extract the problem details
  const { prompt, entry_point } = problem;
  
  // Create a temporary file with the prompt
  const tempFile = `temp_${taskId.replace("/", "_")}.py`;
  await Deno.writeTextFile(tempFile, prompt);
  
  // Initialize the SPARC2 agent
  const agent = new SPARC2Agent({
    model: "gpt-4o",
    mode: "automatic"
  });
  
  await agent.init();
  
  // Generate a solution using SPARC2
  const suggestion = `Implement the ${entry_point} function according to the docstring.`;
  await agent.modifyFiles([tempFile], suggestion);
  
  // Read the generated solution
  const solution = await Deno.readTextFile(tempFile);
  console.log("Generated solution:");
  console.log(solution);
  
  // Clean up
  await Deno.remove(tempFile);
}

// Main function
async function main() {
  // Parse command line arguments
  const args = Deno.args;
  
  if (args.length < 1) {
    console.log("Usage: deno run --allow-read --allow-write --allow-env --allow-net humaneval.test.ts <task_id>");
    console.log("Example: deno run --allow-read --allow-write --allow-env --allow-net humaneval.test.ts HumanEval/0");
    Deno.exit(1);
  }
  
  const taskId = args[0];
  await runHumanEvalTask(taskId);
}

// Run the main function
if (import.meta.main) {
  main().catch(console.error);
}