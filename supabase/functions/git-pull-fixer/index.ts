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