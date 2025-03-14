# GitHub PR Fixer Edge Function

## Overview

This edge function provides an automated system for analyzing and fixing GitHub pull requests using:
- OpenAI's Code Interpreter for code analysis and fixes
- GitHub API integration for PR management
- Vector store and web search for enhanced code context
- Agentic approach for autonomous operation

## Architecture

### Components

1. GitHub API Integration
- Leverages existing github-api edge function endpoints
- Handles PR operations (get details, files, create comments)
- Manages repository interactions (commits, reviews)

2. Code Analysis System
- OpenAI Code Interpreter integration
- Vector store for code context
- Web search integration for best practices and solutions
- Pattern recognition for common issues
- Fix generation capabilities

3. PR Management
- Automated PR analysis workflow
- Fix application system
- Review and comment management
- Status tracking and updates

## Implementation

### Core Infrastructure

1. GitHub API Integration
```typescript
// Leverage existing endpoints from github-api function
const githubApi = {
  getPR: async (owner, repo, pr) => {
    return await fetch(`${EDGE_FUNCTION_URL}/github-api/pulls/${owner}/${repo}/${pr}`);
  },
  getFiles: async (owner, repo, pr) => {
    return await fetch(`${EDGE_FUNCTION_URL}/github-api/pulls/${owner}/${repo}/${pr}/files`);
  }
  // Additional endpoints as needed
};
```

2. Vector Store and Web Search
```typescript
// Initialize vector store and web search capabilities
const contextManager = {
  createVectorStore: async (name) => {
    const vectorStore = await openai.vectorStores.create({ name });
    return vectorStore.id;
  },
  
  searchContext: async (vectorStoreId, query, useWebSearch = true) => {
    const response = await fetch(`${EDGE_FUNCTION_URL}/vector-file`, {
      method: 'POST',
      body: JSON.stringify({ vectorStoreId, query, useWebSearch })
    });
    return await response.json();
  },
  
  saveToVectorStore: async (vectorStoreId, content, filename) => {
    const file = new File([content], filename, { type: 'text/plain' });
    const uploadedFile = await openai.files.create({
      file,
      purpose: "assistants"
    });
    await openai.vectorStores.files.create(vectorStoreId, {
      file_id: uploadedFile.id
    });
  }
};
```

3. Code Analysis
```typescript
const codeAnalyzer = {
  analyzeCode: async (files, vectorStoreId) => {
    // Upload files to vector store
    await uploadToVectorStore(vectorStoreId, files);
    
    // Create analysis assistant
    const assistant = await createAnalysisAssistant(vectorStoreId);
    
    // Run analysis with web search context
    return await runAnalysis(assistant, files);
  }
};
```

### Analysis Pipeline

1. PR Processing
- Fetch PR details and files
- Create vector store context
- Run initial analysis

2. Issue Detection
- Code quality checks
- Security scanning
- Performance analysis
- Best practices validation

3. Fix Generation
- Create fix proposals
- Validate fixes
- Generate commit changes

### Integration Points

1. GitHub Integration
- PR webhook handling
- Status updates
- Review comments
- Fix commits

2. OpenAI Integration  
- Code Interpreter setup
- Analysis prompts
- Fix validation

3. Vector Store Integration
- Code indexing
- Context management
- Web search augmentation

## Environment Setup

Required environment variables:
```
OPENAI_API_KEY=
GITHUB_TOKEN=
EDGE_FUNCTION_URL=
```

## Usage

1. Direct API Call:
```bash
curl -X POST https://[project-ref].supabase.co/functions/v1/git-pull-fixer \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  -d '{"owner": "org", "repo": "repo", "pr": 123}'
```

2. GitHub Webhook:
Configure webhook in repository settings pointing to the function URL.

## Testing

1. Unit Tests
```typescript
// Core component tests
describe('PR Fixer', () => {
  test('analyzes PR correctly', () => {});
  test('generates valid fixes', () => {});
  test('applies fixes safely', () => {});
});
```

2. Integration Tests
```typescript
// End-to-end workflow tests
describe('Integration', () => {
  test('processes PR end-to-end', () => {});
  test('handles errors gracefully', () => {});
});
```

## Deployment

1. Build Function:
```bash
supabase functions deploy git-pull-fixer
```

2. Configure Secrets:
```bash
supabase secrets set OPENAI_API_KEY=
supabase secrets set GITHUB_TOKEN=
```

## Error Handling

1. API Errors
- GitHub API rate limits
- OpenAI API failures
- Network issues

2. Processing Errors  
- Invalid PR data
- Code analysis failures
- Fix application errors

3. Recovery Strategies
- Retry mechanisms
- Fallback options
- Error reporting

## Monitoring

1. Logging
- Operation tracking
- Error reporting
- Performance metrics

2. Metrics
- PR processing times
- Fix success rates
- API usage stats

## Security

1. Authentication
- GitHub token validation
- Supabase auth integration
- API key management

2. Code Safety
- Fix validation
- Commit verification
- Access control

## How It Works

This implementation creates an agentic system that:

1. **Retrieves PR Information**: Fetches PR details and changed files from GitHub
2. **Creates Knowledge Base**: 
   - Builds a vector store with the PR code files
   - Augments context with web search results for best practices
   - Saves search results back to vector store for future reference
3. **Analyzes Code**: Uses OpenAI's Code Interpreter to analyze the code for issues
4. **Generates Fixes**: Suggests code improvements and fixes
5. **Applies Fixes**: Creates commits with fixed code directly to the PR branch
6. **Provides Feedback**: Posts detailed analysis and fix information as PR comments

The system uses two specialized agents:
- **PR Code Analyzer**: Identifies issues and suggests fixes
- **PR Code Fixer**: Applies the suggested fixes to the code

The implementation leverages:
- Code Interpreter for running code analysis
- File Search API for contextual understanding
- Web search for best practices and solutions
- Vector store for efficient code context management
- Automatic context enrichment by saving web search results

```
// pr_analyzer.ts - Agentic PR analyzer and fixer using OpenAI and GitHub APIs

import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import OpenAI from "jsr:@openai/openai";
import { encode } from "https://deno.land/std@0.215.0/encoding/base64.ts";

// Load environment variables
await load({ export: true });
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");

if (!OPENAI_API_KEY || !GITHUB_TOKEN) {
  console.error("Error: OPENAI_API_KEY and GITHUB_TOKEN are required in .env file");
  Deno.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// GitHub API client functions
const github = {
  async getPullRequest(owner: string, repo: string, prNumber: number) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
        },
      }
    );
    return await response.json();
  },

  async getPullRequestFiles(owner: string, repo: string, prNumber: number) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files`,
      {
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
        },
      }
    );
    return await response.json();
  },

  async getFileContent(owner: string, repo: string, path: string, ref: string) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
      {
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
        },
      }
    );
    const data = await response.json();
    return {
      content: atob(data.content),
      sha: data.sha,
    };
  },

  async createComment(owner: string, repo: string, prNumber: number, body: string) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
      }
    );
    return await response.json();
  },

  async createPullRequestReview(
    owner: string,
    repo: string,
    prNumber: number,
    comments: Array<{
      path: string;
      position: number;
      body: string;
    }>,
    event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT" = "COMMENT"
  ) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      {
        method: "POST",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comments,
          event,
        }),
      }
    );
    return await response.json();
  },

  async createCommit(
    owner: string,
    repo: string,
    branch: string,
    path: string,
    message: string,
    content: string,
    sha: string
  ) {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `token ${GITHUB_TOKEN}`,
          "Accept": "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          content: encode(new TextEncoder().encode(content)),
          sha,
          branch,
        }),
      }
    );
    return await response.json();
  },
};

// Create a vector store for code context
async function createVectorStore(name: string): Promise<string> {
  try {
    const vectorStore = await openai.vectorStores.create({
      name,
    });
    console.log(`Vector store created with ID: ${vectorStore.id}`);
    return vectorStore.id;
  } catch (error) {
    console.error("Error creating vector store:", error);
    throw error;
  }
}

// Upload code files to vector store
async function uploadCodeToVectorStore(
  vectorStoreId: string,
  codeFiles: Array<{ filename: string; content: string }>
): Promise<void> {
  for (const file of codeFiles) {
    try {
      // Create a temporary file
      const tempFilePath = await Deno.makeTempFile({ suffix: `.${file.filename.split('.').pop()}` });
      await Deno.writeTextFile(tempFilePath, file.content);
      
      // Upload to OpenAI
      const uploadedFile = await openai.files.create({
        file: await Deno.readFile(tempFilePath),
        purpose: "assistants",
      });
      
      // Add to vector store
      await openai.vectorStores.files.create(vectorStoreId, {
        file_id: uploadedFile.id,
      });
      
      console.log(`File ${file.filename} added to vector store`);
      
      // Clean up temp file
      await Deno.remove(tempFilePath);
    } catch (error) {
      console.error(`Error processing file ${file.filename}:`, error);
    }
  }
}

// Analyze PR using Code Interpreter
async function analyzePullRequest(
  owner: string,
  repo: string,
  prNumber: number,
  modelName: string = "o3-mini-high"
): Promise<void> {
  try {
    console.log(`Analyzing PR #${prNumber} in ${owner}/${repo} using ${modelName}...`);
    
    // Get PR details
    const pr = await github.getPullRequest(owner, repo, prNumber);
    const prFiles = await github.getPullRequestFiles(owner, repo, prNumber);
    
    // Create a vector store for this PR
    const vectorStoreId = await createVectorStore(`pr-${owner}-${repo}-${prNumber}`);
    
    // Collect file contents
    const codeFiles = [];
    for (const file of prFiles) {
      if (file.status !== "removed") {
        try {
          const fileContent = await github.getFileContent(
            owner,
            repo,
            file.filename,
            pr.head.ref
          );
          codeFiles.push({
            filename: file.filename,
            content: fileContent.content,
            sha: fileContent.sha,
          });
        } catch (error) {
          console.error(`Error fetching content for ${file.filename}:`, error);
        }
      }
    }
    
    // Upload code to vector store
    await uploadCodeToVectorStore(
      vectorStoreId,
      codeFiles.map(f => ({ filename: f.filename, content: f.content }))
    );
    
    // Create an assistant with Code Interpreter
    const assistant = await openai.beta.assistants.create({
      name: "PR Code Analyzer",
      instructions: `
        You are an expert code reviewer and fixer. Analyze the provided pull request files for:
        1. Code quality issues
        2. Security vulnerabilities
        3. Performance problems
        4. Best practices violations
        5. Potential bugs
        
        For each issue found:
        - Explain the problem clearly
        - Suggest specific fixes with code examples
        - Rate the severity (low/medium/high)
        
        If you can fix issues automatically, provide the complete fixed file content.
      `,
      model: modelName,
      tools: [
        { type: "code_interpreter" },
        { 
          type: "file_search",
          vector_store_ids: [vectorStoreId]
        }
      ],
    });
    
    // Create a thread
    const thread = await openai.beta.threads.create();
    
    // Add a message to the thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `
        Please analyze this pull request:
        
        Repository: ${owner}/${repo}
        PR #: ${prNumber}
        Title: ${pr.title}
        Description: ${pr.body || "No description provided"}
        
        Changed files:
        ${prFiles.map(f => `- ${f.filename} (${f.additions} additions, ${f.deletions} deletions)`).join("\n")}
        
        Analyze each file for issues and suggest fixes. If you can fix issues automatically, provide the complete fixed code.
      `,
    });
    
    // Run the assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: assistant.id,
    });
    
    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== "completed" && runStatus.status !== "failed") {
      console.log(`Run status: ${runStatus.status}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
    
    if (runStatus.status === "failed") {
      console.error("Analysis failed:", runStatus.last_error);
      return;
    }
    
    // Get the messages
    const messages = await openai.beta.threads.messages.list(thread.id);
    
    // Extract analysis and fixes
    const assistantMessages = messages.data.filter(m => m.role === "assistant");
    const latestMessage = assistantMessages[0];
    
    if (!latestMessage) {
      console.log("No response from assistant");
      return;
    }
    
    // Post analysis as a comment
    let analysisComment = "";
    for (const contentPart of latestMessage.content) {
      if (contentPart.type === "text") {
        analysisComment += contentPart.text.value + "\n\n";
      }
    }
    
    await github.createComment(owner, repo, prNumber, analysisComment);
    console.log("Analysis posted as comment");
    
    // Extract and apply fixes if available
    const fixRegex = /``````/g;
    let match;
    const fixes = [];
    
    while ((match = fixRegex.exec(analysisComment)) !== null) {
      fixes.push(match[1]);
    }
    
    if (fixes.length > 0) {
      // Use a second assistant to apply fixes
      const fixerAssistant = await openai.beta.assistants.create({
        name: "PR Code Fixer",
        instructions: `
          You are an expert code fixer. You will receive code files and suggested fixes.
          Apply the fixes to the code files and return the complete fixed files.
          Be precise and careful when applying fixes.
        `,
        model: modelName,
        tools: [{ type: "code_interpreter" }],
      });
      
      const fixerThread = await openai.beta.threads.create();
      
      // Add files and fixes to the thread
      await openai.beta.threads.messages.create(fixerThread.id, {
        role: "user",
        content: `
          Here are the code files that need fixes:
          
          ${codeFiles.map(f => `
          File: ${f.filename}
          
          \`\`\`
          ${f.content}
          \`\`\`
          `).join("\n\n")}
          
          Here are the suggested fixes:
          
          ${fixes.map((fix, i) => `Fix ${i + 1}:\n\`\`\`\n${fix}\n\`\`\``).join("\n\n")}
          
          Apply these fixes to the appropriate files and return the complete fixed files.
        `,
      });
      
      // Run the fixer assistant
      const fixerRun = await openai.beta.threads.runs.create(fixerThread.id, {
        assistant_id: fixerAssistant.id,
      });
      
      // Poll for completion
      let fixerRunStatus = await openai.beta.threads.runs.retrieve(fixerThread.id, fixerRun.id);
      while (fixerRunStatus.status !== "completed" && fixerRunStatus.status !== "failed") {
        console.log(`Fixer run status: ${fixerRunStatus.status}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        fixerRunStatus = await openai.beta.threads.runs.retrieve(fixerThread.id, fixerRun.id);
      }
      
      if (fixerRunStatus.status === "failed") {
        console.error("Fixing failed:", fixerRunStatus.last_error);
        return;
      }
      
      // Get the fixer messages
      const fixerMessages = await openai.beta.threads.messages.list(fixerThread.id);
      const latestFixerMessage = fixerMessages.data.filter(m => m.role === "assistant")[0];
      
      if (!latestFixerMessage) {
        console.log("No response from fixer assistant");
        return;
      }
      
      // Extract fixed files
      let fixerResponse = "";
      for (const contentPart of latestFixerMessage.content) {
        if (contentPart.type === "text") {
          fixerResponse += contentPart.text.value + "\n\n";
        }
      }
      
      // Parse fixed files
      const fileRegex = /File: ([^\n]+)\s*``````/g;
      let fileMatch;
      
      while ((fileMatch = fileRegex.exec(fixerResponse)) !== null) {
        const filename = fileMatch[1].trim();
        const fixedContent = fileMatch[2].trim();
        
        // Find original file
        const originalFile = codeFiles.find(f => f.filename === filename);
        if (originalFile) {
          // Commit the fix
          try {
            await github.createCommit(
              owner,
              repo,
              pr.head.ref,
              filename,
              `Fix issues in ${filename} [automated]`,
              fixedContent,
              originalFile.sha
            );
            console.log(`Fixed ${filename} and committed changes`);
          } catch (error) {
            console.error(`Error committing fixes for ${filename}:`, error);
          }
        }
      }
      
      // Post a comment about the fixes
      await github.createComment(
        owner,
        repo,
        prNumber,
        "🤖 I've analyzed your code and applied fixes for the issues found. Please review the changes!"
      );
    }
    
  } catch (error) {
    console.error("Error analyzing PR:", error);
  }
}

// CLI interface
async function main() {
  const args = Deno.args;
  
  if (args.length < 3) {
    console.log("Usage: deno run --allow-net --allow-read --allow-write --allow-env pr_analyzer.ts <owner> <repo> <pr_number> [model_name]");
    console.log("Default model: o3-mini-high");
    Deno.exit(1);
  }
  
  const owner = args[0];
  const repo = args[1];
  const prNumber = parseInt(args[2], 10);
  const modelName = args[3] || "o3-mini-high";
  
  await analyzePullRequest(owner, repo, prNumber, modelName);
}

if (import.meta.main) {
  await main();
}

export { analyzePullRequest };

```