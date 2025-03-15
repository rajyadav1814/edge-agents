/**
 * GitIntegration module for SPARC 2.0
 * Provides functions to interact with Git and GitHub for autonomous diff-based code editing
 */

import { logMessage } from "../logger.ts";

/**
 * Options for creating a commit
 */
export interface CommitOptions {
  /** Whether to push the commit to the remote repository */
  push?: boolean;
  /** The remote repository to push to */
  remote?: string;
  /** Additional commit options */
  options?: string[];
}

/**
 * Create a commit using Git CLI commands
 * @param branch Branch name
 * @param filePath File that was modified
 * @param commitMessage Commit message
 * @param options Additional options for the commit
 * @returns The commit hash
 */
export async function createCommit(
  branch: string,
  filePath: string | string[],
  commitMessage: string,
  options: CommitOptions = {}
): Promise<string> {
  // Convert filePath to array if it's a string
  const filePaths = Array.isArray(filePath) ? filePath : [filePath];
  
  // Stage the files
  for (const path of filePaths) {
    const addCmd = new Deno.Command("git", {
      args: ["add", path],
      stdout: "piped",
      stderr: "piped"
    });
    
    const addOutput = await addCmd.output();
    if (!addOutput.success) {
      const errorOutput = new TextDecoder().decode(addOutput.stderr);
      await logMessage("error", `Git add failed for ${path}: ${errorOutput}`, { path });
      throw new Error(`Git add failed for ${path}: ${errorOutput}`);
    }
  }
  
  // Build commit command
  const commitArgs = ["commit", "-m", commitMessage];
  
  // Add any additional options
  if (options.options) {
    commitArgs.push(...options.options);
  }
  
  // Execute commit
  const commitCmd = new Deno.Command("git", {
    args: commitArgs,
    stdout: "piped",
    stderr: "piped"
  });
  
  const commitOutput = await commitCmd.output();
  if (!commitOutput.success) {
    const errorOutput = new TextDecoder().decode(commitOutput.stderr);
    await logMessage("error", `Git commit failed: ${errorOutput}`, { filePaths });
    throw new Error(`Git commit failed: ${errorOutput}`);
  }
  
  const commitText = new TextDecoder().decode(commitOutput.stdout);
  
  // Extract commit hash from output
  const commitHashMatch = commitText.match(/\[([^\]]+)\s+([a-f0-9]+)\]/);
  const commitHash = commitHashMatch ? commitHashMatch[2] : "";
  
  await logMessage("info", `Commit created for ${filePaths.join(", ")}`, { 
    commitHash,
    output: commitText 
  });
  
  // Push if requested
  if (options.push) {
    const remote = options.remote || "origin";
    const pushCmd = new Deno.Command("git", {
      args: ["push", remote, branch],
      stdout: "piped",
      stderr: "piped"
    });
    
    const pushOutput = await pushCmd.output();
    if (!pushOutput.success) {
      const errorOutput = new TextDecoder().decode(pushOutput.stderr);
      await logMessage("error", `Git push failed: ${errorOutput}`, { branch, remote });
      throw new Error(`Git push failed: ${errorOutput}`);
    }
    
    const pushText = new TextDecoder().decode(pushOutput.stdout);
    
    await logMessage("info", `Pushed commit ${commitHash} to ${remote}/${branch}`, { 
      output: pushText 
    });
  }
  
  return commitHash;
}

/**
 * Options for rollback
 */
export interface RollbackOptions {
  /** Whether to force the rollback */
  force?: boolean;
  /** Whether to create a new branch for the rollback */
  newBranch?: string;
}

/**
 * Rollback changes
 * For "checkpoint" mode, uses git reset
 * For "temporal" mode, applies reverse diffs
 * @param target Checkpoint identifier or temporal marker
 * @param mode "checkpoint" or "temporal"
 * @param options Additional options for the rollback
 */
export async function rollbackChanges(
  target: string,
  mode: "checkpoint" | "temporal",
  options: RollbackOptions = {}
): Promise<void> {
  if (mode === "checkpoint") {
    // For checkpoint mode, use git reset
    const resetArgs = ["reset"];
    
    // Add --hard if force is true
    if (options.force) {
      resetArgs.push("--hard");
    }
    
    resetArgs.push(target);
    
    const resetCmd = new Deno.Command("git", {
      args: resetArgs,
      stdout: "piped",
      stderr: "piped"
    });
    
    const resetOutput = await resetCmd.output();
    if (!resetOutput.success) {
      const errorOutput = new TextDecoder().decode(resetOutput.stderr);
      await logMessage("error", `Git checkpoint rollback failed: ${errorOutput}`, { target });
      throw new Error(`Git checkpoint rollback failed: ${errorOutput}`);
    }
    
    const resetText = new TextDecoder().decode(resetOutput.stdout);
    
    await logMessage("info", `Rollback to checkpoint ${target} successful`, { 
      output: resetText 
    });
    
    // Create a new branch if requested
    if (options.newBranch) {
      const branchCmd = new Deno.Command("git", {
        args: ["checkout", "-b", options.newBranch],
        stdout: "piped",
        stderr: "piped"
      });
      
      const branchOutput = await branchCmd.output();
      if (!branchOutput.success) {
        const errorOutput = new TextDecoder().decode(branchOutput.stderr);
        await logMessage("error", `Creating new branch failed: ${errorOutput}`, { branch: options.newBranch });
        throw new Error(`Creating new branch failed: ${errorOutput}`);
      }
      
      const branchText = new TextDecoder().decode(branchOutput.stdout);
      
      await logMessage("info", `Created new branch ${options.newBranch} from checkpoint ${target}`, { 
        output: branchText 
      });
    }
  } else if (mode === "temporal") {
    // For temporal mode, we need to find commits within the time range
    // and then apply reverse diffs
    
    // Parse the target as a date or time range
    const targetDate = new Date(target);
    if (isNaN(targetDate.getTime())) {
      throw new Error(`Invalid temporal target: ${target}. Expected a valid date string.`);
    }
    
    // Get commits since the target date
    const logCmd = new Deno.Command("git", {
      args: ["log", "--since", target, "--format=%H"],
      stdout: "piped",
      stderr: "piped"
    });
    
    const logOutput = await logCmd.output();
    if (!logOutput.success) {
      const errorOutput = new TextDecoder().decode(logOutput.stderr);
      await logMessage("error", `Git log failed: ${errorOutput}`, { target });
      throw new Error(`Git log failed: ${errorOutput}`);
    }
    
    const logText = new TextDecoder().decode(logOutput.stdout);
    
    const commits = logText.trim().split("\n").filter(Boolean);
    
    if (commits.length === 0) {
      await logMessage("info", `No commits found since ${target}`);
      return;
    }
    
    // Create a new branch if requested
    if (options.newBranch) {
      const branchCmd = new Deno.Command("git", {
        args: ["checkout", "-b", options.newBranch],
        stdout: "piped",
        stderr: "piped"
      });
      
      const branchOutput = await branchCmd.output();
      if (!branchOutput.success) {
        const errorOutput = new TextDecoder().decode(branchOutput.stderr);
        await logMessage("error", `Creating new branch failed: ${errorOutput}`, { branch: options.newBranch });
        throw new Error(`Creating new branch failed: ${errorOutput}`);
      }
    }
    
    // Create a revert commit for each commit
    for (const commit of commits) {
      const revertCmd = new Deno.Command("git", {
        args: ["revert", "--no-edit", commit],
        stdout: "piped",
        stderr: "piped"
      });
      
      const revertOutput = await revertCmd.output();
      if (!revertOutput.success) {
        const errorOutput = new TextDecoder().decode(revertOutput.stderr);
        await logMessage("error", `Git revert failed for commit ${commit}: ${errorOutput}`);
        throw new Error(`Git revert failed for commit ${commit}: ${errorOutput}`);
      }
    }
    
    await logMessage("info", `Temporal rollback executed for target ${target}`, { 
      revertedCommits: commits 
    });
  }
}

/**
 * Create a checkpoint
 * @param name Name of the checkpoint
 * @returns The checkpoint identifier (commit hash or tag)
 */
export async function createCheckpoint(name: string): Promise<string> {
  // Create a tag for the checkpoint
  const tagCmd = new Deno.Command("git", {
    args: ["tag", name],
    stdout: "piped",
    stderr: "piped"
  });
  
  const tagOutput = await tagCmd.output();
  if (!tagOutput.success) {
    const errorOutput = new TextDecoder().decode(tagOutput.stderr);
    await logMessage("error", `Creating checkpoint tag failed: ${errorOutput}`, { name });
    throw new Error(`Creating checkpoint tag failed: ${errorOutput}`);
  }
  
  // Get the commit hash for the tag
  const revParseCmd = new Deno.Command("git", {
    args: ["rev-parse", name],
    stdout: "piped",
    stderr: "piped"
  });
  
  const revParseOutput = await revParseCmd.output();
  if (!revParseOutput.success) {
    const errorOutput = new TextDecoder().decode(revParseOutput.stderr);
    await logMessage("error", `Getting checkpoint commit hash failed: ${errorOutput}`, { name });
    throw new Error(`Getting checkpoint commit hash failed: ${errorOutput}`);
  }
  
  const commitHash = new TextDecoder().decode(revParseOutput.stdout).trim();
  
  await logMessage("info", `Created checkpoint ${name} at commit ${commitHash}`);
  
  return commitHash;
}

/**
 * Get the current branch name
 * @returns The current branch name
 */
export async function getCurrentBranch(): Promise<string> {
  const cmd = new Deno.Command("git", {
    args: ["rev-parse", "--abbrev-ref", "HEAD"],
    stdout: "piped",
    stderr: "piped"
  });
  
  const output = await cmd.output();
  if (!output.success) {
    const errorOutput = new TextDecoder().decode(output.stderr);
    await logMessage("error", `Getting current branch failed: ${errorOutput}`);
    throw new Error(`Getting current branch failed: ${errorOutput}`);
  }
  
  const branch = new TextDecoder().decode(output.stdout).trim();
  
  return branch;
}

/**
 * Check if the repository is clean (no uncommitted changes)
 * @returns True if the repository is clean
 */
export async function isRepoClean(): Promise<boolean> {
  const cmd = new Deno.Command("git", {
    args: ["status", "--porcelain"],
    stdout: "piped",
    stderr: "piped"
  });
  
  const output = await cmd.output();
  if (!output.success) {
    const errorOutput = new TextDecoder().decode(output.stderr);
    await logMessage("error", `Checking repo status failed: ${errorOutput}`);
    throw new Error(`Checking repo status failed: ${errorOutput}`);
  }
  
  const statusText = new TextDecoder().decode(output.stdout);
  
  return statusText.trim() === "";
}