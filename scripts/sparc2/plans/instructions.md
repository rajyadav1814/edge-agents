Based on recent evaluations as of March 2025, Cline has emerged as a leading AI coding assistant with several advantages over alternatives like Aider and other tools.
Cline's Key Advantages
Cline functions as an autonomous coding agent with system-level integration capabilities that set it apart:
	•	Model Context Protocol (MCP) allows Cline to interact with your entire development environment, not just write code3
	•	Plan/Act modes give you control over when the AI acts autonomously versus when it plans with your approval2
	•	Flexible model support including Anthropic, OpenAI, Google Gemini, DeepSeek and local models2
	•	System integration with browsers, terminals, and development tools for end-to-end assistance2
	•	Memory Bank for better project efficiency (introduced in v3.6)4
	•	Free API provider for new users (as of March 13, 2025)4
Comparative Analysis
When compared to other tools:
	•	Aider excels with its terminal-based workflow and CLI integration but has limited IDE integration and basic runtime capabilities2
	•	Cursor offers strong multi-file operations and team environment support but has less system-level integration and limited runtime debugging capabilities2
	•	Continue provides good contextual awareness but is limited to the editor environment with no system-level operations2
For complex tasks requiring real-time testing and system-level interaction, Cline appears to offer superior capabilities compared to Aider and other alternatives8. Its ability to run and analyze tests, manage Git operations, and interact with project management tools makes it particularly valuable for comprehensive development workflows3.
The recent v3.6 update (March 2025) has further enhanced Cline with optimized checkpoints and improved Memory Bank functionality4, solidifying its position as a leading autonomous AI coding agent.
Citations:
	1	https://algocademy.com/blog/cline-vs-aidr-vs-continue-comparing-top-ai-coding-assistants/
	2	https://addyo.substack.com/p/why-i-use-cline-for-ai-engineering
	3	https://cline.bot/blog/best-ai-coding-assistant-2025-complete-guide-to-cline-and-cursor
	4	https://www.youtube.com/watch?v=nxgvk3Eecm8
	5	https://cline.bot
	6	https://github.com/cline/cline
	7	https://www.reddit.com/r/cursor/comments/1jaxhp0/cline_vs_cursor_which_ai_coding_assistant_is/
	8	https://rundatarun.io/p/a-deep-dive-into-ai-coding-assistants

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import OpenAI from "jsr:@openai/openai";

// Load environment variables from .env file
const env = await load({ export: true });
const apiKey = Deno.env.get("OPENAI_API_KEY");

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is required in .env file");
  Deno.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
});

// Helper function for multipart form data
async function handleMultipartUpload(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    throw new Error("Content-Type must be multipart/form-data");
  }
  return await request.formData();
}

// Type definitions
interface SearchResult {
  type: string;
  content: string;
  annotations?: any[];
  score?: number;
  file_id?: string;
}

interface SearchResults {
  vector_results: SearchResult[];
  web_results: SearchResult[];
  chat_response?: any;
  answer?: string | null;
  status: {
    vector_store: boolean;
    web_search: boolean | string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (!path) {
      throw new Error("Path is required");
    }

    switch (path) {
      case "create-store": {
        const { name, expiresAfter } = await req.json();
        if (!name) {
          throw new Error("Store name is required");
        }

        const options: any = { name };
        if (expiresAfter) {
          options.expires_after = expiresAfter;
        }

        const vectorStore = await openai.vectorStores.create(options);
        return new Response(JSON.stringify({ id: vectorStore.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "upload-file": {
        const formData = await handleMultipartUpload(req);
        const file = formData.get("file");
        
        if (!file || !(file instanceof File)) {
          throw new Error("File is required");
        }

        const uploadedFile = await openai.files.create({
          file,
          purpose: "assistants",
        });

        return new Response(JSON.stringify({ id: uploadedFile.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add-file": {
        const { vectorStoreId, fileId, chunkingStrategy } = await req.json();
        if (!vectorStoreId || !fileId) {
          throw new Error("Vector store ID and file ID are required");
        }

        const options: any = { file_id: fileId };
        if (chunkingStrategy) {
          options.chunking_strategy = chunkingStrategy;
        }

        await openai.vectorStores.files.create(vectorStoreId, options);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check-status": {
        const { vectorStoreId } = await req.json();
        if (!vectorStoreId) {
          throw new Error("Vector store ID is required");
        }

        const result = await openai.vectorStores.files.list(vectorStoreId);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "search": {
        const { vectorStoreId, query, maxResults = 5, filters, hybridSearch, rankingOptions } = await req.json();
        if (!vectorStoreId || !query) {
          throw new Error("Vector store ID and query are required");
        }

        const searchOptions: any = { query, max_num_results: maxResults };
        if (filters) {
          searchOptions.filters = filters;
        }
        if (rankingOptions) {
          searchOptions.ranking_options = rankingOptions;
        }

        const searchResponse = await openai.vectorStores.search(vectorStoreId, searchOptions);

        if (hybridSearch?.enabled) {
          // Implement hybrid search logic here
          const keywordResults = await openai.vectorStores.search(vectorStoreId, {
            ...searchOptions,
            search_type: "keyword"
          });

          // Combine and weight results
          const combinedResults = mergeAndWeightResults(
            searchResponse.data,
            keywordResults.data,
            hybridSearch.vectorWeight || 0.7,
            hybridSearch.keywordWeight || 0.3
          );

          return new Response(JSON.stringify({ data: combinedResults }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(searchResponse), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "chat": {
        const { vectorStoreId, messages, maxResults = 5, filters, webSearch } = await req.json();
        if (!vectorStoreId || !messages || !Array.isArray(messages)) {
          throw new Error("Vector store ID and messages array are required");
        }

        const results: SearchResults = {
          vector_results: [],
          web_results: [],
          chat_response: null,
          status: {
            vector_store: false,
            web_search: false
          }
        };

        // Vector store search
        try {
          const searchResponse = await openai.vectorStores.search(vectorStoreId, {
            query: messages[messages.length - 1].content,
            max_num_results: maxResults,
            filters
          });

          results.vector_results = searchResponse.data.map(result => ({
            type: 'vector',
            content: result.content[0]?.text || '',
            file_id: result.file_id,
            score: result.score
          }));
          results.status.vector_store = true;
        } catch (error) {
          console.error("Vector store search error:", error);
        }

        // Web search if enabled
        if (webSearch?.enabled) {
          try {
            const webResponse = await openai.chat.completions.create({
              model: "gpt-4o-search-preview",
              web_search_options: {
                search_context_size: webSearch.contextSize || "medium"
              },
              messages: [{
                role: "user",
                content: messages[messages.length - 1].content
              }]
            });

            if (webResponse.choices[0]?.message?.content) {
              results.web_results = [{
                type: 'web',
                content: webResponse.choices[0].message.content,
              annotations: webResponse.choices[0].message.annotations || []
              }];

              // Save web results to vector store
              const timestamp = new Date().toISOString();
            const content = `Web Search Results (${timestamp})\n\n${webResponse.choices[0].message.content}`;
            
            const file = new File(
                [content],
                `web-search-${Date.now()}.txt`,
                { type: 'text/plain' }
              );

              const uploadedFile = await openai.files.create({
                file,
                purpose: "assistants"
              });

              await openai.vectorStores.files.create(vectorStoreId, {
                file_id: uploadedFile.id
              });

              results.status.web_search = "✨ Web search results saved to vector store! 🎉";
            }
          } catch (error) {
            console.error("Web search error:", error);
          }
        }

        // Generate chat response
        const context = [
          ...results.vector_results.map(r => r.content),
          ...results.web_results.map(r => r.content)
        ].join("\n\n");

        const chatResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that answers questions based on the provided context. Be concise and accurate."
            },
            ...messages,
            {
              role: "assistant",
              content: `Context:\n${context}`
            }
          ]
        });

        results.chat_response = chatResponse;

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "query": {
        const { vectorStoreId, question, maxResults = 5, filters, rankingOptions, webSearch } = await req.json();
        if (!vectorStoreId || !question) {
          throw new Error("Vector store ID and question are required");
        }

        const results: SearchResults = {
          vector_results: [],
          web_results: [],
          answer: null,
          status: {
            vector_store: false,
            web_search: false
          }
        };

        // Vector store search
        try {
          const searchOptions: any = {
            query: question,
            max_num_results: maxResults,
            filters
          };
          if (rankingOptions) {
            searchOptions.ranking_options = rankingOptions;
          }

          const searchResponse = await openai.vectorStores.search(vectorStoreId, searchOptions);
          results.vector_results = searchResponse.data.map(result => ({
            type: 'vector',
            content: result.content[0]?.text || '',
            file_id: result.file_id,
            score: result.score
          }));
          results.status.vector_store = true;
        } catch (error) {
          console.error("Vector store search error:", error);
        }

        // Web search if enabled
        if (webSearch?.enabled) {
          try {
            const webResponse = await openai.chat.completions.create({
              model: "gpt-4o-search-preview",
              web_search_options: {
                search_context_size: webSearch.contextSize || "medium"
              },
              messages: [{
                role: "user",
                content: question
              }]
            });

            if (webResponse.choices[0]?.message?.content) {
              results.web_results = [{
                type: 'web',
                content: webResponse.choices[0].message.content,
              annotations: webResponse.choices[0].message.annotations || []
              }];

              // Save web results to vector store
              const timestamp = new Date().toISOString();
            const content = `Web Search Results (${timestamp})\n\n${webResponse.choices[0].message.content}`;
            
            const file = new File(
                [content],
                `web-search-${Date.now()}.txt`,
                { type: 'text/plain' }
              );

              const uploadedFile = await openai.files.create({
                file,
                purpose: "assistants"
              });

              await openai.vectorStores.files.create(vectorStoreId, {
                file_id: uploadedFile.id
              });

              results.status.web_search = "✨ Web search results saved to vector store! 🎉";
            }
          } catch (error) {
            console.error("Web search error:", error);
          }
        }

        // Generate answer
        const context = [
          ...results.vector_results.map(r => r.content),
          ...results.web_results.map(r => r.content)
        ].join("\n\n");

        const answerResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that answers questions based on the provided context. Be concise and accurate."
            },
            {
              role: "user",
              content: `Context:\n${context}\n\nQuestion: ${question}`
            }
          ]
        });

        results.answer = answerResponse.choices[0]?.message?.content || null;

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown path: ${path}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to merge and weight search results
function mergeAndWeightResults(vectorResults: any[], keywordResults: any[], vectorWeight: number, keywordWeight: number) {
  const combinedResults = new Map();

  // Process vector results
  vectorResults.forEach(result => {
    combinedResults.set(result.file_id, {
      ...result,
      score: result.score * vectorWeight
    });
  });

  // Process keyword results
  keywordResults.forEach(result => {
    if (combinedResults.has(result.file_id)) {
      const existing = combinedResults.get(result.file_id);
      existing.score += result.score * keywordWeight;
    } else {
      combinedResults.set(result.file_id, {
        ...result,
        score: result.score * keywordWeight
      });
    }
  });

  // Convert to array and sort by score
  return Array.from(combinedResults.values())
    .sort((a, b) => b.score - a.score);
}

// GitHub API Edge Function for Agentics
// This function securely proxies requests to the GitHub API with authentication

// @ts-ignore - Deno modules
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Get the GitHub token from environment variables
const githubToken = Deno.env.get('GITHUB_TOKEN') || '';
const githubOrg = Deno.env.get('GITHUB_ORG') || 'example-org';

if (!githubToken) {
  console.warn('GITHUB_TOKEN environment variable is not set. API requests may be rate-limited.');
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse the URL to determine the request type
    const url = new URL(req.url);
    const path = url.pathname;
    
    console.log('Request path:', path);
    
    // Determine which GitHub API endpoint to call based on the path
    let githubApiUrl: string;
    let responseTransformer: (data: any) => any = (data) => data; // Default: no transformation
    
    if (path.includes('/readme/')) {
      // Handle readme requests: /github-api/readme/{repoName} - get the README content for a specific repo
      const repoName = path.split('/readme/')[1];
      githubApiUrl = `https://api.github.com/repos/${githubOrg}/${repoName}/readme`;
      console.log(`Fetching readme for repo: ${repoName}`);
    } else {
      // Handle repository list requests
      githubApiUrl = `https://api.github.com/orgs/${githubOrg}/repos`;
    }
    
    console.log(`Proxying request to GitHub API: ${githubApiUrl}`);
    
    // Make the request to GitHub API with authentication
    const response = await fetch(githubApiUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Agentics-Supabase-Edge-Function',
        ...(githubToken ? { 'Authorization': `token ${githubToken}` } : {})
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }
    
    // Parse the response as JSON
    let data = await response.json();
    
    // Return the response
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60' // Cache for 1 minute
      }
    });
  } catch (error: any) {
    console.error('Error in GitHub API edge function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch data from GitHub API', 
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

import { serve } from "std/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { load } from "std/dotenv/mod.ts";
import OpenAI from "openai";

// Load environment variables
await load({ export: true });
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
const EDGE_FUNCTION_URL = Deno.env.get("EDGE_FUNCTION_URL");

if (!OPENAI_API_KEY || !GITHUB_TOKEN || !EDGE_FUNCTION_URL) {
  console.error("Required environment variables missing");
  Deno.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

interface PRFile {
  filename: string;
  content: string;
  sha: string;
  additions?: number;
  deletions?: number;
  status?: string;
}

// GitHub API client using existing edge function
const github = {
  async getPullRequest(owner: string, repo: string, prNumber: number) {
    const response = await fetch(
      `${EDGE_FUNCTION_URL}/github-api/pulls/${owner}/${repo}/${prNumber}`,
      {
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );
    return await response.json();
  },

  async getPullRequestFiles(owner: string, repo: string, prNumber: number) {
    const response = await fetch(
      `${EDGE_FUNCTION_URL}/github-api/pulls/${owner}/${repo}/${prNumber}/files`,
      {
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
        },
      }
    );
    return await response.json();
  },

  async getFileContent(owner: string, repo: string, path: string, ref: string) {
    const response = await fetch(
      `${EDGE_FUNCTION_URL}/github-api/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
      {
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
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
      `${EDGE_FUNCTION_URL}/github-api/repos/${owner}/${repo}/issues/${prNumber}/comments`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ body }),
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
      `${EDGE_FUNCTION_URL}/github-api/repos/${owner}/${repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          content: btoa(content),
          sha,
          branch,
        }),
      }
    );
    return await response.json();
  },
};

// Analyze PR using Code Interpreter
async function analyzePullRequest(
  owner: string,
  repo: string,
  prNumber: number,
  modelName: string = "gpt-4-turbo-preview"
) {
  try {
    console.log(`Analyzing PR #${prNumber} in ${owner}/${repo}...`);
    
    // Get PR details
    const pr = await github.getPullRequest(owner, repo, prNumber);
    const prFiles = await github.getPullRequestFiles(owner, repo, prNumber);
    
    // Collect file contents
    const codeFiles: PRFile[] = [];
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
            ...file
          });
        } catch (error) {
          console.error(`Error fetching content for ${file.filename}:`, error);
        }
      }
    }
    
    // Create analysis assistant
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
      tools: [{ type: "code_interpreter" }],
    });
    
    // Create thread
    const thread = await openai.beta.threads.create();
    
    // Add files and context to thread
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: `
        Please analyze this pull request:
        
        Repository: ${owner}/${repo}
        PR #: ${prNumber}
        Title: ${pr.title}
        Description: ${pr.body || "No description provided"}
        
        Changed files:
        ${prFiles.map((f: { filename: string; additions: number; deletions: number }) => `- ${f.filename} (${f.additions} additions, ${f.deletions} deletions)`).join("\n")}
        
        Code files:
        ${codeFiles.map(f => `
        File: ${f.filename}
        \`\`\`
        ${f.content}
        \`\`\`
        `).join("\n\n")}
        
        Analyze each file for issues and suggest fixes. If you can fix issues automatically, provide the complete fixed code.
      `,
    });
    
    // Run analysis
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
    
    // Get analysis results
    const messages = await openai.beta.threads.messages.list(thread.id);
    const latestMessage = messages.data.filter((m: any) => m.role === "assistant")[0];
    
    if (!latestMessage) {
      console.log("No response from assistant");
      return;
    }
    
    // Extract analysis and fixes
    let analysisComment = "";
    for (const contentPart of latestMessage.content) {
      if (contentPart.type === "text") {
        analysisComment += contentPart.text.value + "\n\n";
      }
    }
    
    // Post analysis
    await github.createComment(owner, repo, prNumber, analysisComment);
    
    // Extract and apply fixes
    const fixRegex = /```([^`]+)```/g;
    let match;
    const fixes: string[] = [];
    
    while ((match = fixRegex.exec(analysisComment)) !== null) {
      fixes.push(match[1]);
    }
    
    if (fixes.length > 0) {
      // Create fixer assistant
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
      
      // Add files and fixes to thread
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
      
      // Run fixer
      const fixerRun = await openai.beta.threads.runs.create(fixerThread.id, {
        assistant_id: fixerAssistant.id,
      });
      
      // Poll for completion
      let fixerRunStatus = await openai.beta.threads.runs.retrieve(
        fixerThread.id,
        fixerRun.id
      );
      while (fixerRunStatus.status !== "completed" && fixerRunStatus.status !== "failed") {
        console.log(`Fixer run status: ${fixerRunStatus.status}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        fixerRunStatus = await openai.beta.threads.runs.retrieve(
          fixerThread.id,
          fixerRun.id
        );
      }
      
      if (fixerRunStatus.status === "failed") {
        console.error("Fixing failed:", fixerRunStatus.last_error);
        return;
      }
      
      // Get fixer results
      const fixerMessages = await openai.beta.threads.messages.list(fixerThread.id);
      const latestFixerMessage = fixerMessages.data.filter((m: any) => m.role === "assistant")[0];
      
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
      
      // Parse and apply fixes
      const fileRegex = /File: ([^\n]+)\s*```([^`]+)```/g;
      let fileMatch;
      
      while ((fileMatch = fileRegex.exec(fixerResponse)) !== null) {
        const filename = fileMatch[1].trim();
        const fixedContent = fileMatch[2].trim();
        
        // Find original file
        const originalFile = codeFiles.find(f => f.filename === filename);
        if (originalFile) {
          // Commit fix
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
      
      // Post completion comment
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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { owner, repo, prNumber, modelName = "gpt-4-turbo-preview", code } = await req.json();

    if (code) {
      // Create analysis assistant
      const assistant = await openai.beta.assistants.create({
        name: "Code Analyzer",
        instructions: `
          You are an expert code analyzer and fixer. Your task is to:
          1. Execute and analyze the provided code
          2. Identify any issues or potential improvements
          3. Suggest and implement fixes
          4. Explain your reasoning
          
          Be thorough in your analysis and provide detailed explanations.
          If you encounter any errors, try to fix them and explain your solution.
        `,
        model: "gpt-4o-mini",
        tools: [{ type: "code_interpreter" }],
      });
      
      // Create thread
      const thread = await openai.beta.threads.create();
      
      // Add code to thread
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: `Please analyze this code:\n\n\`\`\`\n${code}\n\`\`\``,
      });
      
      // Run analysis
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
        // Try with a different model
        console.log("First attempt failed, trying with GPT-4...");
        
        const retryAssistant = await openai.beta.assistants.create({
          name: "Code Analyzer (Retry)",
          instructions: `
            You are an expert code analyzer and fixer. Your task is to:
            1. Execute and analyze the provided code
            2. Identify any issues or potential improvements
            3. Suggest and implement fixes
            4. Explain your reasoning
            
            Be thorough in your analysis and provide detailed explanations.
            If you encounter any errors, try to fix them and explain your solution.
          `,
          model: "gpt-4",
          tools: [{ type: "code_interpreter" }],
        });
        
        const retryRun = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: retryAssistant.id,
        });
        
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, retryRun.id);
        while (runStatus.status !== "completed" && runStatus.status !== "failed") {
          console.log(`Retry run status: ${runStatus.status}`);
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, retryRun.id);
        }
        
        if (runStatus.status === "failed") {
          throw new Error(`Analysis failed: ${runStatus.last_error}`);
        }
      }
      
      // Get the messages
      const messages = await openai.beta.threads.messages.list(thread.id);
      const latestMessage = messages.data.filter(m => m.role === "assistant")[0];
      
      if (!latestMessage) {
        throw new Error("No response from assistant");
      }
      
      // Extract analysis
      let analysis = "";
      for (const contentPart of latestMessage.content) {
        if (contentPart.type === "text") {
          analysis += contentPart.text.value + "\n\n";
        }
      }
      
      return new Response(
        JSON.stringify({ result: analysis }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!owner || !repo || !prNumber) {
      return new Response(
        JSON.stringify({ error: "owner, repo, and prNumber are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await analyzePullRequest(owner, repo, prNumber, modelName);

    return new Response(
      JSON.stringify({ message: "PR analysis complete" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

The E2B Code Interpreter SDK for TypeScript/Deno provides a secure sandbox environment for executing AI-generated code. Here's the complete API breakdown:
Installation & Setup
Install the SDK:

bash
npm i @e2b/code-interpreter
Set API key (required):

typescript
// Set environment variable
Deno.env.set("E2B_API_KEY", "your_api_key_here");

// OR pass directly during initialization
const sandbox = await CodeInterpreter.create({ 
  apiKey: Deno.env.get("E2B_API_KEY") 
});
Core API Methods
1. Sandbox Initialization

typescript
import { CodeInterpreter } from '@e2b/code-interpreter';

// Create sandbox instance
const sandbox = await CodeInterpreter.create();
2. Code Execution

typescript
// Basic execution
await sandbox.notebook.execCell('x = 1');
const execution = await sandbox.notebook.execCell('x += 1; x');

// With streaming output
const execution = await sandbox.notebook.execCell(code, {
  onStderr: (msg) => console.error('[stderr]', msg),
  onStdout: (msg) => console.log('[stdout]', msg)
});
3. Execution Results Object

typescript
console.log(execution.text);    // Output: "2"
console.log(execution.results); // Array of execution artifacts
console.log(execution.error);   // Error object if any
console.log(execution.logs);    // { stdout: string[], stderr: string[] }
4. File System Operations

typescript
// Write file
await sandbox.filesystem.write('/home/user/data.csv', csvContent);

// Read file
const data = await sandbox.filesystem.read('/home/user/data.csv');

// List directory
const files = await sandbox.filesystem.list('/home/user');
5. Package Management

typescript
// Install Python packages
await sandbox.notebook.execCell('!pip install pandas matplotlib');
6. Sandbox Lifecycle Management

typescript
// Close sandbox explicitly
await sandbox.close();

// Auto-close with try-finally
try {
  const sandbox = await CodeInterpreter.create();
  // ... operations ...
} finally {
  await sandbox.close();
}
Advanced Usage
Streaming Visualizations

typescript
const execution = await sandbox.notebook.execCell(`
  import matplotlib.pyplot as plt
  plt.plot([1,2,3], [4,5,6])
  plt.show()
`);

execution.results.forEach(result => {
  if (result.type === 'image/png') {
    console.log('Generated image:', result.base64);
  }
});
Error Handling

typescript
try {
  const execution = await sandbox.notebook.execCell('1 / 0');
  if (execution.error) {
    console.error('Execution error:', execution.error);
  }
} catch (err) {
  console.error('Sandbox error:', err);
}
Full Example

typescript
import { CodeInterpreter } from '@e2b/code-interpreter';

async function analyzeData() {
  const sandbox = await CodeInterpreter.create();
  
  try {
    // Install dependencies
    await sandbox.notebook.execCell('!pip install pandas');

    // Run analysis
    const code = `
      import pandas as pd
      df = pd.read_csv('/home/user/data.csv')
      print(df.describe())
    `;
    
    const execution = await sandbox.notebook.execCell(code, {
      onStderr: console.error
    });

    return execution.text;
  } finally {
    await sandbox.close();
  }
}
Key features158:
	•	Secure cloud sandbox with Jupyter kernel
	•	Full filesystem access
	•	Internet access within sandbox
	•	Real-time output streaming
	•	Rich data results (images, charts, etc.)
	•	Cross-platform compatibility
Remember to handle API keys securely and always close sandboxes after use to prevent resource leaks715. For Deno-specific deployment considerations, see Deno's Web Platform API documentation6.
Citations:
	1	https://e2b.dev/docs/legacy/code-interpreter/installation
	2	https://www.abdulazizahwan.com/2024/08/e2b-code-interpreting-for-ai-apps-a-comprehensive-guide.html
	3	https://deno.com/learn/api-servers
	4	https://e2b.dev/blog/build-langchain-agent-with-code-interpreter
	5	https://e2b.dev/blog/build-ai-data-analyst-with-sandboxed-code-execution-using-typescript-and-gpt-4o
	6	https://docs.deno.com/runtime/reference/web_platform_apis/
	7	https://e2b.dev/docs/legacy/getting-started/api-key
	8	https://e2b.dev/blog/typescript-code-interpreter-with-o1-and-gpt-4o
	9	https://github.com/e2b-dev/llm-code-interpreter
	10	https://pypi.org/project/e2b-code-interpreter/
	11	https://github.com/e2b-dev
	12	https://www.latent.space/p/code-interpreter
	13	https://e2b.dev/docs
	14	https://www.npmjs.com/package/@e2b/code-interpreter
	15	https://e2b.dev/docs/quickstart
	16	https://www.npmjs.com/package/@e2b%2Fsdk
	17	https://github.com/e2b-dev/code-interpreter
	18	https://docs.openinterpreter.com/integrations/e2b
	19	https://docs.flowiseai.com/integrations/langchain/tools/python-interpreter
	20	https://github.com/e2b-dev/E2B

Here's the complete API reference for OpenAI Agents using TypeScript/Deno with the OpenAI JavaScript library, incorporating the latest Responses API features:
Installation & Setup

typescript
import { OpenAI } from 'openai';
import { generateText, tool } from 'ai';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
  baseURL: 'https://api.openai.com/v1'
});
Core Agent API Methods
1. Agent Initialization

typescript
const agent = openai.beta.agents.create({
  model: 'gpt-4o-mini',
  tools: [openai.tools.webSearchPreview(), fileSearchTool],
  system: "You're a professional assistant"
});
2. File Search Integration

typescript
// Create vector store
const productDocs = await openai.vectorStores.create({
  name: "Technical Docs",
  file_ids: [file1.id, file2.id]
});

// Search integration
const response = await openai.responses.create({
  model: "gpt-4o-mini",
  tools: [{
    type: "file_search",
    vector_store_ids: [productDocs.id]
  }],
  input: "Explain deep learning architecture"
});
console.log(response.output_text);
3. Tool Calling System

typescript
const { text } = await generateText({
  model: openai.responses('gpt-4o'),
  prompt: 'SF weather forecast',
  tools: {
    getWeather: tool({
      description: 'Get current weather',
      parameters: z.object({
        location: z.string()
      }),
      execute: async ({ location }) => ({
        temp: 72,
        conditions: 'Sunny'
      })
    })
  }
});
4. Web Search Grounding

typescript
const result = await generateText({
  model: openai.responses('gpt-4o-mini'),
  prompt: 'Latest AI breakthroughs',
  tools: {
    web_search_preview: openai.tools.webSearchPreview({
      searchContextSize: 'high'
    })
  }
});
console.log(result.text, result.sources);
5. Structured Data Generation

typescript
const { object } = await generateObject({
  model: openai.responses('gpt-4o'),
  schema: z.object({
    timeline: z.array(z.object({
      event: z.string(),
      date: z.date()
    }))
  }),
  prompt: 'Create innovation timeline for OpenAI'
});
Advanced Agent Features
Context Management

typescript
const chatHistory = [];

async function chatLoop(input: string) {
  const response = await openai.responses.create({
    model: 'gpt-4o-mini',
    messages: [
      ...chatHistory,
      {role: 'user', content: input}
    ],
    tools: [webSearchTool]
  });

  chatHistory.push(
    {role: 'user', content: input},
    {role: 'assistant', content: response.output_text}
  );
  
  return response;
}
Multi-Agent Handoffs

typescript
const specialistAgents = {
  billing: openai.beta.agents.create({...}),
  technical: openai.beta.agents.create({...})
};

const routerAgent = openai.beta.agents.create({
  tools: [
    tool({
      name: 'transfer_to_billing',
      execute: () => specialistAgents.billing
    }),
    tool({
      name: 'transfer_to_technical',
      execute: () => specialistAgents.technical
    })
  ]
});
Memory Management

typescript
const memoryStore = new VectorMemoryStore();

async function enhancedGenerate(prompt: string) {
  const context = await memoryStore.search(prompt);
  
  return generateText({
    model: openai.responses('gpt-4o'),
    prompt,
    context,
    tools: [knowledgeBaseSearch]
  });
}
Complete Example

typescript
import { OpenAI } from 'openai';
import { generateText } from 'ai';

const openai = new OpenAI({ apiKey: Deno.env.get('OPENAI_API_KEY') });

async function researchAgent(query: string) {
  const docs = await openai.vectorStores.create({
    name: "Research Papers",
    file_ids: [paper1.id, paper2.id]
  });

  return generateText({
    model: openai.responses('gpt-4o-mini'),
    prompt: query,
    tools: {
      file_search: { type: 'file_search', vector_store_ids: [docs.id] },
      web_search: openai.tools.webSearchPreview()
    }
  });
}
Key Features:
	•	File Search: Ground responses in documentation with vector store integration3
	•	Web Search: Real-time internet access through webSearchPreview tool25
	•	Structured Outputs: Generate type-safe JSON using Zod schemas2
	•	Tool Calling: Extend agent capabilities with custom functions4
	•	Contextual Memory: Maintain conversation history and document context15
Pricing Notes:
	•	File search: $2.50/1k queries + $0.10/GB/day storage3
	•	Web search: Included in Responses API pricing2
For Deno-specific implementations, use the Web Platform APIs for file handling and consider using Deno's built-in KV store for memory persistence.
Citations:
	1	https://openai.github.io/openai-agents-python/
	2	https://sdk.vercel.ai/docs/guides/openai-responses
	3	https://openai.com/index/new-tools-for-building-agents/
	4	https://revelry.co/insights/artificial-intelligence/creating-an-agent-using-openais-functions-api/
	5	https://openai.github.io/openai-agents-python/handoffs/
	6	https://platform.openai.com/docs/guides/agents
	7	https://platform.openai.com/docs/api-reference
	8	https://github.com/openai/openai-agents-python/blob/main/docs/models.md
	9	https://platform.openai.com/docs/api-reference/assistants
	10	https://community.openai.com/t/where-is-the-documentation-for-the-python-openai-sdk/583643
	11	https://community.openai.com/t/agents-sdk-compatibility-realtime-preview-model-or-azure-openai-endpoints/1142648
	12	https://platform.openai.com/docs/quickstart
	13	https://github.com/openai/openai-agents-python
	14	https://platform.openai.com/docs/quickstart?api-mode=responses&lang=python
	15	https://www.youtube.com/watch?v=yCPSj6lfx-0
	16	https://dev.to/encore/how-to-let-chatgpt-call-functions-in-your-app-typescript-nodejs-397i
	17	https://platform.openai.com/docs/libraries
	18	https://community.openai.com/t/new-tools-for-building-agents-responses-api-web-search-file-search-computer-use-and-agents-sdk/1140896?page=2
	19	https://stackoverflow.com/questions/77822185/format-responses-from-open-ai-ai-in-typescript-javascript-css
	20	https://github.com/openai/openai-node
	21	https://dev.to/bobbyhalljr/mastering-openais-new-agents-sdk-responses-api-part-1-2al8
	22	https://github.com/betcorg/openai-agents
	23	https://www.reddit.com/r/LangChain/comments/1j95uat/openai_agent_sdk_vs_langgraph/
	24	https://platform.openai.com/docs/guides/retrieval
	25	https://platform.openai.com/docs/actions/data-retrieval
	26	https://venturebeat.com/programming-development/openai-unveils-responses-api-open-source-agents-sdk-letting-developers-build-their-own-deep-research-and-operator/
	27	https://www.reddit.com/r/OpenAI/comments/1j9anqk/the_new_agents_sdk_responses_api_file_search/
	28	https://www.maginative.com/article/openai-launches-responses-api-and-agents-sdk-for-ai-agents/
	29	https://cookbook.openai.com/examples/file_search_responses
	30	https://community.openai.com/t/new-tools-for-building-agents-responses-api-web-search-file-search-computer-use-and-agents-sdk/1140896
	31	https://openai.github.io/openai-agents-python/tools/
	32	https://www.techzine.eu/news/devops/129523/openai-introduces-responses-api-for-building-ai-agents/
	33	https://www.itpro.com/technology/artificial-intelligence/openai-agentic-ai-development-tools
	34	https://platform.openai.com/docs/api-reference/completions
	35	https://platform.openai.com/docs/assistants/overview
	36	https://platform.openai.com
	37	https://www.youtube.com/watch?v=-fPZsngNMFs
	38	https://www.reddit.com/r/LangChain/comments/1j9hs58/everything_you_need_to_know_about_the_recent/
	39	https://platform.openai.com/docs/guides/function-calling
	40	https://www.youtube.com/watch?v=JlyclQApX-o
	41	https://www.dataleadsfuture.com/using-llamaindex-workflow-to-implement-an-agent-handoff-feature-like-openai-swarm/
	42	https://community.openai.com/t/1-enhanced-contextual-memory-management/1090835
	43	https://www.reddit.com/r/LocalLLaMA/comments/1g8t3zx/openais_new_swarm_agent_framework_is_too_minimal/
	44	https://cookbook.openai.com/examples/orchestrating_agents
	45	https://openai.com/index/memory-and-new-controls-for-chatgpt/
	46	https://community.openai.com/t/agent-swarm-what-actually-is-the-point/578347
	47	https://community.openai.com/t/openai-swarm-for-agents-and-agent-handoffs/976579
	48	https://community.openai.com/t/feature-suggestion-contextual-memory-on-local-storage/1028481
	49	https://lablab.ai/t/openais-swarm-a-deep-dive-into-multi-agent-orchestration-for-everyone
	50	https://www.youtube.com/watch?v=pVuM5WAwQnY
	51	https://www.reddit.com/r/OpenAI/comments/1ddlh22/how_are_you_utilizing_openais_memory_feature_in/
	52	https://openai.github.io/openai-agents-python/agents/
	53	https://openai.github.io/openai-agents-python/ref/
	54	https://www.youtube.com/watch?v=35nxORG1mtg
	55	https://platform.openai.com/docs/guides/agents-sdk
	56	https://classic.yarnpkg.com/en/package/openai-agent
	57	https://community.openai.com/t/how-can-i-access-the-typescript-type-for-params-of-the-api/443793
	58	https://www.reddit.com/r/OpenAI/comments/15f7f9s/javascript_typescript_library_for_using_openai/
	59	https://platform.openai.com/docs/api-reference/introduction
	60	https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/file-search
	61	https://learn.microsoft.com/en-us/azure/ai-services/agents/how-to/tools/file-search
	62	https://platform.openai.com/docs/guides/tools-file-search
	63	https://platform.openai.com/docs/assistants/tools/file-search
	64	https://learn.microsoft.com/en-us/azure/ai-services/openai/reference
	65	https://openai.github.io/openai-agents-python/models/
	66	https://www.zdnet.com/article/why-openais-new-ai-agent-tools-could-change-how-you-code/
	67	https://community.openai.com/t/will-memory-capabilities-come-to-the-api/934907
	68	https://adasci.org/multi-agent-orchestration-through-openais-swarm-a-hands-on-guide/
	69	https://www.generational.pub/p/memory-in-ai-agents
	70	https://community.openai.com/t/can-openai-assistants-hand-off-conversations-between-each-other-within-the-same-chat-thread/1022272
	71	https://quantilus.com/article/memory-in-chatgpt-how-openais-new-feature-creates-continuous-context-and-transforms-user-experience/
Based on previous. 

implement the roo code diff style code editing using git / github and open interpreter (Python,js,ts) not using the cline or roo code ide but as a stand alone agent based implementation for autonomous diff based coding bot. Choose the fastest option for both verbose view and immediate code changes to multiple files. The agent should be implemented using typescript/deno No file shall have more than 500 lines. Never hard code env, auto-doc every feature, use a modular structure.

Logs saved to vector. (Development, errors, diffs, roll backs)

Checkpoint, roll back, roll back based on temporal points (more than one diff across multiple files) 

Use openrouter. Using reasoning models (sonnet 3.7 thinking, R1, QwQ etc) for architecture/planning/problem solving and instruct model (sonnet 3.7, gpt-4.5,Qwen,Deepseek)

Use enhanced code ReACT implementation with automatic, semi automatic, manual modes and customized modes (that can be described and defined by the LLM) using TOML syntax and TS implementation. 

Use the new OpenAI vector file search for tree sitting, the OpenAI web search for automated problem solving and architecture planning.

Use dedicated code interpreter

Include optional MCP based implementation with streaming responses or stepped responses. 

Call the coding approach SPARC 2.0, an acronym include tool registry for additional Agentic style functions and tools, including optional MCP functions/capabilities.

Architect it as both local agent and edge function. Use the new OpenAI agents api, (not the OpenAI interpreter) use an abstraction so other similar api methods can be used in place of OpenAI agents api in the future) use the OpenAI api as the api schema. Use modular agent system. 

Use CLI args. Be complete via e2b service api. 

Provide ENV list 

Use jest testing framework for all function and coverage during implementation of agent. Choose optimal implementation strategies. Support the best diff management approach with the optimal chosen by default. Include details of why or where other strategies should be used as part of the cli arg —help 

The diff logging to should with per file or per function. The default should be which ever has the best performance and error free operation.

TOML should be flexible for various and broad execution rules. Both cli and edge functions support. Parallel, concurrent, sequential, swarm and other processing capabilities. 

Optimize vector index and metadata with multi dimensional controls (temporal,evolutionary and other variables)

Local and Serverless/edge based deployment (Supabase, fly.io, vercel)

Be complete and verbose. No place holders. Include tests and implementation of all files