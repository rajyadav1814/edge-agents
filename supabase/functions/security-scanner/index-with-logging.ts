import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { logger } from "./logger.ts";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import OpenAI from "jsr:@openai/openai";

// Load environment variables from .env file
logger.info("Loading environment variables...");
const env = await load({ export: true });
const apiKey = Deno.env.get("OPENAI_API_KEY");
const githubToken = Deno.env.get("GITHUB_TOKEN");

if (!apiKey) {
  logger.error("OPENAI_API_KEY is required in .env file");
  Deno.exit(1);
}
logger.success("OpenAI API key loaded successfully");

if (!githubToken) {
  logger.warn("GITHUB_TOKEN is not set. GitHub API requests may be rate-limited.");
}

logger.info("Initializing OpenAI client...");
// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
});
logger.success("OpenAI client initialized");

// Import the email service
import { sendEmail } from "./email-service.ts";

// For simplicity in this example, we'll use a mock implementation
// In a real implementation, you would properly integrate with the index.ts file

// Type definitions for security findings
interface SecurityFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'credentials' | 'dependency' | 'code_pattern' | 'configuration';
  file: string;
  line_number?: number;
  description: string;
  recommendation: string;
  cve_ids?: string[];
  score: number;
}

interface ScanResult {
  repo_name: string;
  scan_id: string;
  timestamp: string;
  findings: SecurityFinding[];
  statistics: {
    files_scanned: number;
    issues_by_severity: Record<string, number>;
    trends: any;
  }
}

// Mock implementation of security scanner functions for demonstration
const securityScanner = {
  // Create a vector store for a repository
  async createRepoVectorStore(repoName: string): Promise<string> {
    logger.info(`Mock: Creating vector store for ${repoName}`);
    return `vs_${crypto.randomUUID()}`;
  },

  // Scan a repository for security issues
  async scanRepository(repoName: string, branch: string = "main"): Promise<ScanResult> {
    logger.info(`Mock: Scanning repository ${repoName}:${branch}`);
    return {
      repo_name: repoName,
      scan_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      findings: [],
      statistics: {
        files_scanned: 0,
        issues_by_severity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        trends: {}
      }
    };
  },

  // Get historical scan results
  async getHistoricalScans(repoName: string, limit: number = 10): Promise<ScanResult[]> {
    logger.info(`Mock: Getting historical scans for ${repoName} (limit: ${limit})`);
    return [{
      repo_name: repoName,
      scan_id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      findings: [],
      statistics: {
        files_scanned: 0,
        issues_by_severity: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        trends: {}
      }
    }];
  },

  // Create GitHub issues for findings
  async createGitHubIssues(repoName: string, findings: SecurityFinding[]): Promise<{ created: number, issues: string[] }> {
    logger.info(`Mock: Creating GitHub issues for ${findings.length} findings in ${repoName}`);
    return { created: 0, issues: [] };
  },

  // Generate HTML content for the security report
  generateReportHtml(scanResult: ScanResult, includeRecommendations: boolean): string {
    logger.info(`Mock: Generating HTML report for ${scanResult.repo_name}`);
    return `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <h1 style="color: #333;">Security Scan Report: ${scanResult.repo_name}</h1>
        <p style="color: #666;">Scan completed on: ${new Date(scanResult.timestamp).toLocaleString()}</p>
        <p>This is a mock report for demonstration purposes.</p>
      </div>
    `;
  },

  // Send a security report via email
  async sendSecurityReport(repoName: string, recipient: string, includeRecommendations: boolean = true): Promise<boolean> {
    logger.info(`Attempting to send security report for ${repoName} to ${recipient}...`);
    try {
      // Get the latest scan results
      const scanResults = await this.getHistoricalScans(repoName, 1);
      if (scanResults.length === 0) {
        logger.error(`No scan results found for repository: ${repoName}`);
        return false;
      }
      
      // Generate HTML content for the email
      const latestScan = scanResults[0];
      logger.info(`Found scan result from ${latestScan.timestamp} with ${latestScan.findings.length} findings`);
      
      // Generate HTML content for the email
      logger.info(`Generating HTML report...`);
      const htmlContent = this.generateReportHtml(latestScan, includeRecommendations);
      
      // Send the email using the email service
      logger.info(`Sending email to ${recipient} via email-service...`);
      const success = await sendEmail(
        "Security Scanner",
        htmlContent,
        recipient,
        "notify"
      );
      
      if (success) {
        logger.success(`Email sent successfully to ${recipient}`);
      } else {
        logger.error(`Failed to send email to ${recipient}`);
      }
      
      return success;
    } catch (error) {
      logger.error("Error sending security report:", error);
      return false;
    }
  }
};

// Main serve function with enhanced logging
serve(async (req) => {
  // CORS handling
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  logger.info(`Received ${req.method} request: ${req.url}`);
  const startTime = Date.now();

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (!path) {
      throw new Error("Path is required");
    }

    // Get client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for") || 
                    req.headers.get("cf-connecting-ip") || 
                    "unknown";
    
    logger.info(`Processing request for endpoint: ${path} from ${clientIp}`);

    // Parse request body
    const requestBody = await req.json();
    logger.info(`Request body: ${JSON.stringify(requestBody)}`);

    // Route handling with enhanced logging
    let response;
    switch (path) {
      case "init-scan": {
        logger.info(`Initializing scan for repository: ${requestBody.repo}`);
        const { repo } = requestBody;
        if (!repo) {
          throw new Error("Repository name is required");
        }
        
        const vectorStoreId = await securityScanner.createRepoVectorStore(repo);
        logger.success(`Vector store created with ID: ${vectorStoreId}`);
        response = { vectorStoreId };
        break;
      }

      case "scan-repo": {
        const { repo, branch = "main" } = requestBody;
        if (!repo) {
          throw new Error("Repository name is required");
        }
        
        logger.info(`Starting full security scan for ${repo}:${branch}...`);
        const scanResult = await securityScanner.scanRepository(repo, branch);
        logger.success(`Security scan completed for ${repo}:${branch}`);
        logger.info(`Found ${scanResult.findings.length} security issues`);
        logger.info(`Issues by severity: ${JSON.stringify(scanResult.statistics.issues_by_severity)}`);
        response = scanResult;
        break;
      }

      case "scan-results": {
        const { repo, limit = 10 } = requestBody;
        if (!repo) {
          throw new Error("Repository name is required");
        }
        
        logger.info(`Getting historical scan results for ${repo} (limit: ${limit})...`);
        const results = await securityScanner.getHistoricalScans(repo, limit);
        logger.success(`Retrieved ${results.length} historical scan results`);
        response = { results };
        break;
      }

      case "create-issues": {
        const { repo, findings } = requestBody;
        if (!repo || !findings || !Array.isArray(findings)) {
          throw new Error("Repository name and findings array are required");
        }
        
        logger.info(`Creating GitHub issues for ${findings.length} findings in ${repo}...`);
        const issueResults = await securityScanner.createGitHubIssues(repo, findings);
        logger.success(`Created ${issueResults.created} GitHub issues`);
        response = issueResults;
        break;
      }

      case "cron-trigger": {
        const { repo, branch = "main", sendReport = false, recipient } = requestBody;
        if (!repo) {
          throw new Error("Repository name is required");
        }
        
        logger.info(`Received cron trigger for ${repo}:${branch}`);
        const scanId = crypto.randomUUID();
        
        logger.info(`Queueing asynchronous scan for ${repo}:${branch}...`);
        // Queue the scan to run asynchronously
        securityScanner.scanRepository(repo, branch)
          .then(async (scanResult) => {
            logger.info(`Asynchronous scan completed for ${repo}:${branch}`);
            // Send report if requested
            if (sendReport && recipient) {
              logger.info(`Sending report to ${recipient}...`);
              await securityScanner.sendSecurityReport(repo, recipient);
            }
          })
          .catch(error => logger.error(`Error in asynchronous scan for ${repo}:${branch}:`, error));
        
        response = { scanId, message: "Scan queued successfully" };
        break;
      }

      case "send-report": {
        const { repo, recipient, includeRecommendations = true } = requestBody;
        if (!repo || !recipient) {
          throw new Error("Repository name and recipient email are required");
        }
        
        logger.info(`Sending security report for ${repo} to ${recipient}...`);
        const success = await securityScanner.sendSecurityReport(repo, recipient, includeRecommendations);
        
        if (success) {
          logger.success(`Security report sent successfully to ${recipient}`);
          response = { 
            success: true, 
            message: "Security report sent successfully" 
          };
        } else {
          logger.error(`Failed to send security report to ${recipient}`);
          return new Response(JSON.stringify({ 
            success: false, 
            message: "Failed to send security report" 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        break;
      }

      default:
        logger.error(`Unknown path: ${path}`);
        throw new Error(`Unknown path: ${path}`);
    }

    const endTime = Date.now();
    logger.success(`Request processed in ${endTime - startTime}ms`);
    
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Request error: ${errorMessage}`);
    
    const endTime = Date.now();
    logger.info(`Request failed in ${endTime - startTime}ms`);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
