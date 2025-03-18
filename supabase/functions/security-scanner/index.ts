import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import OpenAI from "jsr:@openai/openai";
import { compareVersions } from "https://deno.land/x/compare_versions@0.3.0/mod.ts";
import { logger } from "./logger.ts";
import { sendSecurityReport as sendSecurityReportEmail } from "./send-report.ts";


// Load environment variables from .env file
const env = await load({ export: true });
const apiKey = Deno.env.get("OPENAI_API_KEY");
const githubToken = Deno.env.get("GITHUB_TOKEN");

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is required in .env file");
  Deno.exit(1);
}

if (!githubToken) {
  console.error("Warning: GITHUB_TOKEN is not set. GitHub API requests may be rate-limited.");
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
});

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
  lastCommitSha?: string;
  findings: SecurityFinding[];
  statistics: {
    files_scanned: number;
    issues_by_severity: Record<string, number>;
    trends: any;
  }
}

// Rate limiting configuration
const rateLimits = {
  "init-scan": { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  "scan-repo": { maxRequests: 5, windowMs: 60000 },  // 5 requests per minute
  "scan-results": { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute
  "create-issues": { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  "cron-trigger": { maxRequests: 5, windowMs: 60000 }  // 5 requests per minute
};

// Create a vector store for a repository
async function createRepoVectorStore(repoName: string): Promise<string> {
  const vectorStore = await openai.vectorStores.create({
    name: `security-scan-${repoName}`,
    expires_after: {
      anchor: "last_active_at",
      days: 90 // Keep security data for 90 days
    }
  });
  
  return vectorStore.id;
}

// Get or create a vector store for a repository
async function getOrCreateVectorStore(repoName: string): Promise<string> {
  try {
    // Try to find existing vector store
    const vectorStores = await openai.vectorStores.list();
    const existingStore = vectorStores.data.find(store => 
      store.name === `security-scan-${repoName}`
    );
    
    if (existingStore) {
      return existingStore.id;
    }
    
    // Create new vector store if not found
    return await createRepoVectorStore(repoName);
  } catch (error) {
    console.error("Error getting/creating vector store:", error);
    return await createRepoVectorStore(repoName);
  }
}

// Add security findings to vector store
async function storeSecurityFindings(
  vectorStoreId: string, 
  findings: SecurityFinding[]
): Promise<void> {
  // Convert findings to text for vectorization
  for (const finding of findings) {
    const findingText = `
      Severity: ${finding.severity}
      Category: ${finding.category}
      File: ${finding.file}
      Line: ${finding.line_number || 'N/A'}
      Description: ${finding.description}
      Recommendation: ${finding.recommendation}
      CVE IDs: ${finding.cve_ids?.join(', ') || 'None'}
      Score: ${finding.score}
      Timestamp: ${new Date().toISOString()}
    `;
    
    // Create a file with the finding
    const file = new File(
      [findingText],
      `finding-${Date.now()}.txt`,
      { type: 'text/plain' }
    );

    // Upload to OpenAI
    const uploadedFile = await openai.files.create({
      file,
      purpose: "assistants"
    });

    // Add to vector store
    await openai.vectorStores.files.create(vectorStoreId, {
      file_id: uploadedFile.id
    });
  }
}

// Get the last scan SHA for incremental scanning
async function getLastScanSHA(repoName: string): Promise<string | null> {
  try {
    // Get the latest scan results
    const scanResults = await getHistoricalScans(repoName, 1);
    if (scanResults.length === 0) {
      return null; // No previous scans
    }
    
    // Check if the scan result has a lastCommitSha property
    if ('lastCommitSha' in scanResults[0]) {
      return scanResults[0].lastCommitSha as string;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting last scan SHA:", error);
    return null;
  }
}

// Get the latest commit SHA for a repository
async function getLatestCommitSHA(repoName: string, branch: string = "main"): Promise<string | null> {
  try {
    const response = await fetch(`https://api.github.com/repos/${repoName}/commits/${branch}`, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Security-Scanner',
        ...(githubToken ? { 'Authorization': `token ${githubToken}` } : {})
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.sha;
    }
    
    return null;
  } catch (error) {
    console.error("Error getting latest commit SHA:", error);
    return null;
  }
}

// Fetch repository content from GitHub
async function fetchRepositoryContent(
  repoName: string, 
  branch: string = "main"
): Promise<{ path: string; content: string; sha: string }[]> {
  // GitHub API base URL
  const apiUrl = `https://api.github.com/repos/${repoName}`;
  
  // Get repository contents
  const response = await fetch(`${apiUrl}/git/trees/${branch}?recursive=1`, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'Supabase-Security-Scanner',
      ...(githubToken ? { 'Authorization': `token ${githubToken}` } : {})
    }
  });
  
  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  const files = data.tree.filter((item: any) => item.type === 'blob');
  
  // Fetch content for files with pagination
  const fileContents: { path: string; content: string; sha?: string }[] = [];
  const filesToProcess = files.length > 500 ? files.slice(0, 500) : files; // Process up to 500 files
  for (const file of filesToProcess) {
    try {
      const contentResponse = await fetch(`${apiUrl}/contents/${file.path}?ref=${branch}`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Supabase-Security-Scanner',
          ...(githubToken ? { 'Authorization': `token ${githubToken}` } : {})
        }
      });
      
      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        // GitHub API returns content as base64
        const content = atob(contentData.content);
        fileContents.push({ path: file.path, content, sha: file.sha });
      }
    } catch (error) {
      console.error(`Error fetching content for ${file.path}:`, error);
    }
  }
  
  return fileContents as { path: string; content: string; sha: string }[];
}

// Scan for hardcoded secrets in code
async function scanForSecrets(
  files: { path: string; content: string }[]
): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  
  // Regex patterns for common secrets
  const secretPatterns = [
    { pattern: /(?:password|passwd|pwd)[\s]*[=:][\s]*['"]([^'"]{8,})['"]/, category: 'credentials', severity: 'high' },
    { pattern: /(?:api[_-]?key|apikey|token)[\s]*[=:][\s]*['"]([^'"]{8,})['"]/, category: 'credentials', severity: 'high' },
    { pattern: /(?:secret|private[_-]?key)[\s]*[=:][\s]*['"]([^'"]{8,})['"]/, category: 'credentials', severity: 'high' },
    { pattern: /-----BEGIN PRIVATE KEY-----/, category: 'credentials', severity: 'critical' },
    { pattern: /-----BEGIN RSA PRIVATE KEY-----/, category: 'credentials', severity: 'critical' },
    { pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/, category: 'credentials', severity: 'critical' },
    { pattern: /(?:aws_access_key_id|aws_secret_access_key)[\s]*[=:][\s]*['"]([^'"]{8,})['"]/, category: 'credentials', severity: 'critical' },
  ];
  
  for (const file of files) {
    // Skip binary files and certain file types
    if (file.path.match(/\.(jpg|jpeg|png|gif|ico|woff|ttf|eot|svg|bin|exe|dll|so|dylib)$/i)) {
      continue;
    }
    
    const lines = file.content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const { pattern, category, severity } of secretPatterns) {
        const match = line.match(pattern);
        
        if (match) {
          findings.push({
            severity: severity as 'critical' | 'high' | 'medium' | 'low',
            category: category as 'credentials' | 'dependency' | 'code_pattern' | 'configuration',
            file: file.path,
            line_number: i + 1,
            description: `Potential hardcoded ${category} found in code`,
            recommendation: `Remove hardcoded ${category} and use environment variables or a secure secret management system`,
            score: severity === 'critical' ? 9.5 : 7.5
          });
        }
      }
    }
  }
  
  return findings;
}

// Scan dependencies for vulnerabilities
// This function now supports multiple package ecosystems
async function scanDependencies(
  files: { path: string; content: string }[]
): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  
  // Look for package.json files
  const packageJsonFiles = files.filter(file => file.path.endsWith('package.json'));
  // Look for requirements.txt files (Python)
  const requirementsTxtFiles = files.filter(file => file.path.endsWith('requirements.txt'));
  // Look for Gemfile files (Ruby)
  const gemfileFiles = files.filter(file => file.path.endsWith('Gemfile'));
  
  for (const file of packageJsonFiles) {
    try {
      const packageJson = JSON.parse(file.content);
      
      // Check dependencies and devDependencies
      const dependencies = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      
      for (const [packageName, version] of Object.entries(dependencies)) {
        // Skip if version is not a string
        if (typeof version !== 'string') continue;
        
        // Clean version string (remove ^ or ~ prefix)
        const cleanVersion = version.replace(/[\^~]/, '');

        // Check for known vulnerable packages (this is a simplified example)
        const knownVulnerablePackages = [
          { name: 'lodash', minVersion: '4.17.21', severity: 'high', cve: 'CVE-2021-23337' },
          { name: 'minimist', minVersion: '1.2.6', severity: 'high', cve: 'CVE-2021-44906' },
          { name: 'node-fetch', minVersion: '2.6.7', severity: 'high', cve: 'CVE-2022-0235' },
          { name: 'express', minVersion: '4.17.3', severity: 'medium', cve: 'CVE-2022-24999' },
        ];
        
        for (const vulnPackage of knownVulnerablePackages) {
          if (packageName === vulnPackage.name) {
            // Proper version comparison using compareVersions library
            const isVulnerable = compareVersions(cleanVersion, vulnPackage.minVersion) < 0;
            
            if (isVulnerable) {
              findings.push({
                severity: vulnPackage.severity as 'critical' | 'high' | 'medium' | 'low',
                category: 'dependency',
                file: file.path,
                description: `Vulnerable dependency ${packageName}@${cleanVersion} found`,
                recommendation: `Update ${packageName} to version ${vulnPackage.minVersion} or later`,
                cve_ids: [vulnPackage.cve],
                score: vulnPackage.severity === 'high' ? 7.8 : 5.5
              });
            }
          }
        }
        
        // For a more comprehensive check, we would use the web search capability
        // to find the latest CVEs for each dependency
      }
    } catch (error) {
      console.error(`Error parsing package.json in ${file.path}:`, error);
    }
  }

  // Process Python requirements.txt files
  for (const file of requirementsTxtFiles) {
    try {
      const lines = file.content.split('\n');
      
      for (const line of lines) {
        // Skip comments and empty lines
        if (line.trim().startsWith('#') || line.trim() === '') {
          continue;
        }
        
        // Parse package name and version
        // Format can be: package==1.0.0, package>=1.0.0, package<=1.0.0, etc.
        const match = line.match(/^([a-zA-Z0-9_\-\.]+)(?:[=<>]+)([0-9\.]+)/);
        if (match) {
          const [, packageName, version] = match;
          
          // Known vulnerable Python packages
          const knownVulnerablePythonPackages = [
            { name: 'django', minVersion: '3.2.14', severity: 'high', cve: 'CVE-2022-28346' },
            { name: 'flask', minVersion: '2.0.3', severity: 'medium', cve: 'CVE-2022-24761' },
            { name: 'requests', minVersion: '2.27.1', severity: 'medium', cve: 'CVE-2022-21363' },
          ];
          
          for (const vulnPackage of knownVulnerablePythonPackages) {
            if (packageName.toLowerCase() === vulnPackage.name) {
              const isVulnerable = compareVersions(version, vulnPackage.minVersion) < 0;
              
              if (isVulnerable) {
                findings.push({
                  severity: vulnPackage.severity as 'critical' | 'high' | 'medium' | 'low',
                  category: 'dependency',
                  file: file.path,
                  description: `Vulnerable Python dependency ${packageName}@${version} found`,
                  recommendation: `Update ${packageName} to version ${vulnPackage.minVersion} or later`,
                  cve_ids: [vulnPackage.cve],
                  score: vulnPackage.severity === 'high' ? 7.8 : 5.5
                });
              }
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error parsing requirements.txt in ${file.path}:`, error);
    }
  }

  // Process Ruby Gemfile files
  for (const file of gemfileFiles) {
    try {
      const lines = file.content.split('\n');
      
      for (const line of lines) {
        // Look for gem declarations
        const match = line.match(/gem\s+['"]([^'"]+)['"]\s*,\s*['"]([^'"]+)['"]/);
        if (match) {
          const [, gemName, version] = match;
          
          // In a real implementation, we would check for known vulnerable Ruby gems
          // This is a placeholder for demonstration purposes
          // Similar to the npm and Python implementations above
        }
      }
    } catch (error) {
      console.error(`Error parsing Gemfile in ${file.path}:`, error);
    }
  }
  
  // Additional package ecosystems could be added here (e.g., Go, Java, etc.)
  
  return findings;
}

// Analyze configuration files for security issues
async function analyzeConfigurations(
  files: { path: string; content: string }[]
): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  
  // Check Docker files
  const dockerfiles = files.filter(file => 
    file.path.endsWith('Dockerfile') || 
    file.path.includes('docker-compose')
  );
  
  for (const file of dockerfiles) {
    const lines = file.content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check for running as root
      if (line.match(/USER\s+root/i)) {
        findings.push({
          severity: 'medium',
          category: 'configuration',
          file: file.path,
          line_number: i + 1,
          description: 'Docker container running as root user',
          recommendation: 'Use a non-root user for running applications in Docker containers',
          score: 5.0
        });
      }
      
      // Check for hardcoded environment variables
      if (line.match(/ENV\s+\w+_KEY|\w+_SECRET|\w+_TOKEN|\w+_PASSWORD/i)) {
        findings.push({
          severity: 'high',
          category: 'configuration',
          file: file.path,
          line_number: i + 1,
          description: 'Hardcoded sensitive environment variable in Dockerfile',
          recommendation: 'Use build arguments or environment files instead of hardcoding sensitive values',
          score: 7.5
        });
      }
    }
  }
  
  // Check for insecure configurations in other files
  // This would be expanded in a real implementation
  
  return findings;
}

// Detect vulnerability patterns using vector similarity
async function detectVulnerabilityPatterns(
  files: { path: string; content: string }[]
): Promise<SecurityFinding[]> {
  const findings: SecurityFinding[] = [];
  
  // In a real implementation, we would:
  // 1. Have a database of known vulnerability patterns
  // 2. Convert code snippets to vectors
  // 3. Compare with known vulnerability patterns using vector similarity
  
  // For this example, we'll use a simplified pattern matching approach
  const vulnerabilityPatterns = [
    {
      pattern: /eval\s*\(/,
      language: 'javascript',
      severity: 'high',
      description: 'Use of eval() can lead to code injection vulnerabilities',
      recommendation: 'Avoid using eval() and use safer alternatives'
    },
    {
      pattern: /document\.write\s*\(/,
      language: 'javascript',
      severity: 'medium',
      description: 'Use of document.write() can lead to XSS vulnerabilities',
      recommendation: 'Use safer DOM manipulation methods instead'
    },
    {
      pattern: /exec\s*\(\s*['"].*\$\{/,
      language: 'javascript',
      severity: 'critical',
      description: 'Potential command injection vulnerability with template literals in exec()',
      recommendation: 'Use child_process.execFile() or validate and sanitize user input'
    },
    {
      pattern: /\.innerHTML\s*=/,
      language: 'javascript',
      severity: 'medium',
      description: 'Use of innerHTML can lead to XSS vulnerabilities',
      recommendation: 'Use textContent or safer DOM manipulation methods'
    }
  ];
  
  for (const file of files) {
    // Skip non-code files
    if (!file.path.match(/\.(js|ts|jsx|tsx|py|rb|php|java|go|c|cpp|cs)$/i)) {
      continue;
    }
    
    const lines = file.content.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      for (const pattern of vulnerabilityPatterns) {
        if (line.match(pattern.pattern)) {
          findings.push({
            severity: pattern.severity as 'critical' | 'high' | 'medium' | 'low',
            category: 'code_pattern',
            file: file.path,
            line_number: i + 1,
            description: pattern.description,
            recommendation: pattern.recommendation,
            score: pattern.severity === 'critical' ? 9.0 : 
                   pattern.severity === 'high' ? 7.0 : 
                   pattern.severity === 'medium' ? 5.0 : 3.0
          });
        }
      }
    }
  }
  
  return findings;
}

// Search for latest CVEs for a dependency
async function searchLatestCVEs(
  packageName: string, 
  version: string
): Promise<string[]> {
  try {
    const webResponse = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      messages: [{
        role: "user",
        content: `Find the latest CVEs and security advisories for the following package: ${packageName}@${version}. Return only the CVE IDs in a JSON array format.`
      }],
      web_search_options: {
        search_context_size: "high"
      }
    });

    // Extract CVE IDs from response
    const content = webResponse.choices[0]?.message?.content || "[]";
    try {
      const cveIds = JSON.parse(content);
      return Array.isArray(cveIds) ? cveIds : [];
    } catch (error) {
      console.error("Error parsing CVE response:", error);
      return [];
    }
  } catch (error) {
    console.error("Error searching for CVEs:", error);
    return [];
  }
}

// Enhance dependency findings with web search
async function enhanceDependencyFindings(
  findings: SecurityFinding[]
): Promise<SecurityFinding[]> {
  const enhancedFindings = [...findings];
  
  for (const finding of enhancedFindings) {
    if (finding.category === 'dependency') {
      // Extract package name and version from description
      const match = finding.description.match(/([a-zA-Z0-9\-_\.]+)@([0-9\.]+)/);
      if (match) {
        const [, packageName, version] = match;
        const cveIds = await searchLatestCVEs(packageName, version);
        
        if (cveIds.length > 0) {
          finding.cve_ids = [...(finding.cve_ids || []), ...cveIds];
          finding.description += `\n\nLatest CVEs: ${cveIds.join(', ')}`;
          
          // Increase severity if critical CVEs found
          if (cveIds.some(cve => cve.includes('CRITICAL'))) {
            finding.severity = 'critical';
            finding.score = Math.max(finding.score, 9.0);
          }
        }
      }
    }
  }
  
  return enhancedFindings;
}

// Create GitHub issues for findings
async function createGitHubIssues(
  repoName: string, 
  findings: SecurityFinding[]
): Promise<{ created: number, issues: string[] }> {
  if (!githubToken) {
    console.warn("GitHub token not provided. Skipping issue creation.");
    return { created: 0, issues: [] };
  }
  
  const createdIssues: string[] = [];
  
  for (const finding of findings) {
    try {
      const issueTitle = `[Security] ${finding.severity.toUpperCase()}: ${finding.category} issue in ${finding.file}`;
      
      const issueBody = `
## Security Issue Detected

**Severity:** ${finding.severity.toUpperCase()}
**Category:** ${finding.category}
**File:** ${finding.file}${finding.line_number ? `\n**Line:** ${finding.line_number}` : ''}
**Score:** ${finding.score}/10

### Description
${finding.description}

### Recommendation
${finding.recommendation}

${finding.cve_ids && finding.cve_ids.length > 0 ? `### CVE IDs\n${finding.cve_ids.join('\n')}` : ''}

---
*This issue was automatically created by the Security Scanner.*
      `;
      
      const response = await fetch(`https://api.github.com/repos/${repoName}/issues`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `token ${githubToken}`,
          'User-Agent': 'Supabase-Security-Scanner'
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: ['security', finding.severity]
        })
      });
      
      if (response.ok) {
        const issue = await response.json();
        createdIssues.push(issue.html_url);
      } else {
        console.error(`Error creating GitHub issue: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error creating GitHub issue:", error);
    }
  }
  
  return { created: createdIssues.length, issues: createdIssues };
}

// Calculate security trends by comparing with previous scans
async function calculateSecurityTrends(
  repoName: string,
  currentScan: ScanResult
): Promise<Record<string, any>> {
  try {
    // Get previous scan results (up to 5)
    const previousScans = await getHistoricalScans(repoName, 5);
    
    // If no previous scans, return empty trends
    if (previousScans.length === 0) {
      return {
        first_scan: true,
        comparison: null
      };
    }
    
    // Filter out the current scan if it's already in the results
    const filteredScans = previousScans.filter(scan => scan.scan_id !== currentScan.scan_id);
    
    // If still no previous scans, return empty trends
    if (filteredScans.length === 0) {
      return {
        first_scan: true,
        comparison: null
      };
    }
    
    // Get the most recent previous scan
    const previousScan = filteredScans[0];
    
    // Calculate changes in issue counts
    const criticalChange = currentScan.statistics.issues_by_severity.critical - 
                          (previousScan.statistics.issues_by_severity.critical || 0);
    const highChange = currentScan.statistics.issues_by_severity.high - 
                      (previousScan.statistics.issues_by_severity.high || 0);
    const mediumChange = currentScan.statistics.issues_by_severity.medium - 
                        (previousScan.statistics.issues_by_severity.medium || 0);
    const lowChange = currentScan.statistics.issues_by_severity.low - 
                     (previousScan.statistics.issues_by_severity.low || 0);
    
    // Calculate total change
    const totalCurrent = currentScan.findings.length;
    const totalPrevious = previousScan.findings.length;
    const totalChange = totalCurrent - totalPrevious;
    const percentChange = totalPrevious > 0 ? 
                         (totalChange / totalPrevious) * 100 : 0;
    
    return {
      first_scan: false,
      comparison: {
        previous_scan_id: previousScan.scan_id,
        previous_scan_date: previousScan.timestamp,
        days_since_previous: Math.floor((new Date(currentScan.timestamp).getTime() - 
                                       new Date(previousScan.timestamp).getTime()) / 
                                       (1000 * 60 * 60 * 24)),
        changes: {
          critical: criticalChange,
          high: highChange,
          medium: mediumChange,
          low: lowChange,
          total: totalChange,
          percent: percentChange
        }
      }
    };
  } catch (error) {
    console.error("Error calculating security trends:", error);
    return { error: "Failed to calculate trends" };
  }
}

// Helper function to convert plain text findings to JSON
function convertPlainTextToJson(text: string): any {
  try {
    // Check if this is a plain text finding (starts with "Severity:")
    if (text.trim().startsWith('Severity:')) {
      // Parse the plain text format into a structured object
      const lines = text.split('\n').map(line => line.trim());
      const finding: any = {};
      
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim().toLowerCase();
          const value = line.substring(colonIndex + 1).trim();
          
          switch (key) {
            case 'severity':
              finding.severity = value.toLowerCase();
              break;
            case 'category':
              finding.category = value.toLowerCase();
              break;
            case 'file':
              finding.file = value;
              break;
            case 'line':
              finding.line_number = parseInt(value, 10);
              break;
            case 'description':
              finding.description = value;
              break;
            case 'recommendation':
              finding.recommendation = value;
              break;
            case 'cve ids':
              finding.cve_ids = value !== 'None' ? value.split(', ') : [];
              break;
            case 'score':
              finding.score = parseFloat(value);
              break;
            case 'timestamp':
              finding.timestamp = value;
              break;
          }
        }
      }
      
      return finding;
    }
    
    return null;
  } catch (error) {
    logger.error("Error converting plain text to JSON:", error);
    return null;
  }
}

// Helper function to log JSON content in chunks for debugging
function logJsonInChunks(jsonText: string, chunkSize: number = 500): void {
  try {
    const totalChunks = Math.ceil(jsonText.length / chunkSize);
    logger.info(`Logging JSON in ${totalChunks} chunks of ${chunkSize} characters each:`);
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min((i + 1) * chunkSize, jsonText.length);
      const chunk = jsonText.substring(start, end);
      logger.info(`Chunk ${i+1}/${totalChunks}: ${chunk}`);
    }
  } catch (error) {
    logger.error("Error logging JSON in chunks:", error);
  }
}

// Helper function to fix specific JSON array issues
function fixJsonArrayIssues(jsonText: string, errorPosition?: number): string {
  try {
    // If we know the error position, focus on that area
    if (errorPosition && errorPosition > 0 && errorPosition < jsonText.length) {
      // Look at a window around the error position
      const start = Math.max(0, errorPosition - 50);
      const end = Math.min(jsonText.length, errorPosition + 50);
      const problemArea = jsonText.substring(start, end);
      
      logger.info(`Problem area around position ${errorPosition}: ${problemArea}`);
      
      // Check for common array issues in this area
      if (problemArea.includes('[') || problemArea.includes(']')) {
        // Fix array-related issues
        const fixedArea = problemArea
          .replace(/,(\s*[\]}])/g, '$1')  // Remove trailing commas
          .replace(/\[\s*,/g, '[')        // Fix leading commas in arrays
          .replace(/,\s*,/g, ',')         // Fix double commas
          .replace(/\](\s*)\[/g, '],$1[') // Add missing commas between arrays
          .replace(/\]([^\]\},])/g, '],$1'); // Add missing commas after arrays
        
        if (fixedArea !== problemArea) {
          jsonText = jsonText.substring(0, start) + fixedArea + jsonText.substring(end);
          logger.info(`Fixed problem area: ${fixedArea}`);
        }
      }
    }
    
    return jsonText;
  } catch (error) {
    logger.error("Error fixing specific JSON array issues:", error);
    return jsonText;
  }
}

// Helper function to attempt to extract a valid JSON object from text
function extractValidJson(text: string): string | null {
  try {
    // Try to find a complete JSON object
    const jsonMatch = text.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1];
    }
    
    // If we can't find a complete object, check if this is a JSON fragment
    if (text.trim().startsWith('"') && text.includes(':')) {
      // This might be a fragment of a JSON object
      // Wrap it in curly braces to make it a valid object
      return `{${text}}`;
    }
    
    // Check if this is a plain text finding
    if (text.trim().startsWith('Severity:')) {
      // This is handled by convertPlainTextToJson
      return null;
    }
    
    // If we can't extract a valid JSON, return null
    return null;
  } catch (error) {
    logger.error("Error extracting valid JSON:", error);
    return null;
  }
}

// Helper function to fix JSON arrays specifically
function fixJsonArrays(jsonText: string): string {
  try {
    // Find all array patterns in the JSON
    const arrayPattern = /\[([^\[\]]*)\]/g;
    let match;
    
    // Keep track of the original text for comparison
    const originalText = jsonText;
    
    // Process each array found in the JSON
    while ((match = arrayPattern.exec(originalText)) !== null) {
      const arrayContent = match[1];
      const startPos = match.index;
      const endPos = startPos + match[0].length;
      
      // Fix common array issues
      let fixedArray = '[' + arrayContent
        // Remove trailing commas
        .replace(/,\s*$/g, '')
        // Fix missing commas between elements (numbers, strings, objects, arrays)
        .replace(/(".*?"|\d+|\}|\])\s+(".*?"|\d+|\{|\[)/g, '$1,$2')
        // Fix extra commas
        .replace(/,\s*,/g, ',')
        // Ensure proper quoting for string elements
        .replace(/([,\[]\s*)([^",\{\[\]\}\s][^",\{\[\]\}\s,]*?)(\s*[,\]])/g, '$1"$2"$3')
        + ']';
      
      // Replace the array in the original text if changes were made
      if (fixedArray !== match[0]) {
        jsonText = jsonText.substring(0, startPos) + fixedArray + jsonText.substring(endPos);
      }
    }
    
    return jsonText;
  } catch (error) {
    logger.error("Error fixing JSON arrays:", error);
    return jsonText;
  }
}

// Helper function to try a more lenient JSON parsing approach
function tryLenientJsonParse(jsonText: string): any {
  try {
    // First try standard JSON.parse
    return JSON.parse(jsonText);
  } catch (error) {
    logger.warn(`Standard JSON parse failed: ${error.message}. Trying lenient parsing...`);
    logger.info(`Problem JSON: ${jsonText.substring(0, 100)}...`);
    
    try {
      // Replace the problematic area around position 2706 with a simpler structure
      if (jsonText.length > 2706) {
        const errorPosition = 2706;
        const start = Math.max(0, errorPosition - 50);
        const end = Math.min(jsonText.length, errorPosition + 50);
        
        // Check if we're in an array context
        const beforeError = jsonText.substring(Math.max(0, errorPosition - 200), errorPosition);
        const afterError = jsonText.substring(errorPosition, Math.min(jsonText.length, errorPosition + 200));
        
        if (beforeError.lastIndexOf('[') > beforeError.lastIndexOf(']')) {
          // We're inside an array, try to fix it by replacing the problematic section with a simple value
          const fixedJson = jsonText.substring(0, start) + 
                           '[]' + // Replace with empty array
                           jsonText.substring(end);
          
          logger.info(`Attempting lenient parse with simplified array`);
          return JSON.parse(fixedJson);
        }
        
        // Try to extract a valid JSON object
        const validJson = extractValidJson(jsonText);
        if (validJson) {
          logger.info(`Extracted valid JSON: ${validJson.substring(0, 100)}...`);
          return JSON.parse(validJson);
        }
        
      }
      throw error; // Re-throw if our specific fix didn't work
    } catch (lenientError) {
      logger.error(`Lenient JSON parse also failed: ${lenientError.message}`);
      throw error; // Throw the original error
    }
  }
}

// Get historical scan results
async function getHistoricalScans(
  repoName: string, 
  limit: number = 10
): Promise<ScanResult[]> {
  try {
    // Get vector store for the repository
    const vectorStoreId = await getOrCreateVectorStore(repoName);
    
    // Search for scan results
    const searchResponse = await openai.vectorStores.search(vectorStoreId, {
      query: "scan results",
      max_num_results: limit
    });
    
    // Parse scan results
    const scanResults: ScanResult[] = [];
    
    for (const result of searchResponse.data) {
      try {
        if (result.content && result.content[0]?.text) {
          // Get the JSON text from the result
          let jsonText = result.content[0].text;

          // Log the JSON text for debugging
          logger.info(`Attempting to parse JSON: ${jsonText.substring(0, 100)}...`);
          
          // Add more logging to see the problematic JSON
          logger.info(`JSON length: ${jsonText.length}`);
          if (jsonText.length > 2000) {
            // Log the area around position 2706 (from the error message)
            const errorPosition = 2706;
            const start = Math.max(0, errorPosition - 100);
            const end = Math.min(jsonText.length, errorPosition + 100);
            logger.info(`JSON around position ${errorPosition}: ${jsonText.substring(start, end)}`);
          }
          
          try {
            // Try to parse the JSON directly
            const scanResult = JSON.parse(jsonText);
            if (scanResult.repo_name && scanResult.scan_id) {
              scanResults.push(scanResult);
            }
          } catch (parseError) {
            // Check if this is a plain text finding
            const plainTextFinding = convertPlainTextToJson(jsonText);
            if (plainTextFinding) {
              logger.info(`Converted plain text to JSON: ${JSON.stringify(plainTextFinding).substring(0, 100)}...`);
              // Create a minimal scan result with this finding
              scanResults.push({ repo_name: repoName, scan_id: crypto.randomUUID(), timestamp: plainTextFinding.timestamp || new Date().toISOString(), findings: [plainTextFinding], statistics: { files_scanned: 0, issues_by_severity: {}, trends: {} } });
              continue;
            }
            
            // If parsing fails, try to clean up the JSON string
            logger.warn(`JSON parse error: ${parseError.message}. Attempting to clean up JSON.`);
            
            // Try to fix specific array issues based on the error message
            jsonText = fixJsonArrayIssues(jsonText, 2706);

            // Apply array-specific fixes
            jsonText = fixJsonArrays(jsonText);
            
            // Fix array-related issues (trailing commas, missing brackets)
            jsonText = jsonText
              // Fix trailing commas in arrays
              .replace(/,(\s*[\]}])/g, '$1')
              // Fix missing commas between array elements
              .replace(/\](\s*)\[/g, '],$1[')
              // Fix unbalanced array brackets
              .replace(/\]([^\]\},])/g, '],$1');
            
            // Try to extract valid JSON using a more reliable approach
            const jsonMatch = jsonText.match(/(\{[\s\S]*\})/);
            if (jsonMatch && jsonMatch[1]) {
              jsonText = jsonMatch[1];
              
              // Remove any trailing commas before closing brackets or braces
              jsonText = jsonText.replace(/,(\s*[\]}])/g, '$1');
              
              // Fix any unbalanced quotes in key-value pairs
              jsonText = jsonText.replace(/([{,]\s*)([^"'\s]+)(\s*:)/g, '$1"$2"$3');
              
              // Additional array-specific fixes
              jsonText = jsonText
                // Fix missing quotes around array indices
                .replace(/\[(\d+)\]/g, '["$1"]')
                // Fix array element issues
                .replace(/\[\s*,/g, '[')
                .replace(/,\s*\]/g, ']')
                .replace(/,\s*,/g, ',')
                // Fix unescaped quotes in strings
                .replace(/"([^"]*)"([^"]*)"([^"]*)"/g, function(match, p1, p2, p3) {
                  return '"' + p1 + p2.replace(/"/g, '\\"') + p3 + '"';
                });
              
              // Fix key-value pairs again after other replacements
              jsonText = jsonText.replace(/([{,]\s*)([^"'\s]+)(\s*:)/g, '$1"$2"$3');
              
              // Try one more approach - if the error is at position 2706 and mentions array elements
              if (parseError.message.includes('array element') && 
                  parseError.message.includes('2706')) {
                logger.info(`Attempting to fix array element issue at position 2706`);
                // Try to replace the problematic array with an empty array
                const pos = 2706;
                jsonText = jsonText.substring(0, pos - 10) + "[]" + jsonText.substring(pos + 10);
              }
              
              logger.info(`Cleaned JSON: ${jsonText.substring(0, 100)}...`);
              
              // Try parsing the cleaned JSON
              try {
                const cleanedResult = JSON.parse(jsonText);
                if (cleanedResult.repo_name && cleanedResult.scan_id) {
                  scanResults.push(cleanedResult);
                }
              } catch (cleanupError) {
                logger.error(`Failed to parse JSON after cleanup: ${cleanupError.message}`);
                
                // Last resort - try lenient parsing
                try {
                  const lenientResult = tryLenientJsonParse(jsonText);
                  if (lenientResult && lenientResult.repo_name && lenientResult.scan_id) {
                    scanResults.push(lenientResult);
                  }
                } catch (lenientError) {
                  logger.error(`Lenient parsing also failed: ${lenientError.message}`);
                }
              }
            } else {
              logger.error("Could not extract valid JSON structure");
            }
          }
        }
      } catch (error) {
        logger.error("Error processing scan result:", error);
      }
    }
    
    return scanResults;
  } catch (error) {
    console.error("Error getting historical scans:", error);
    return [];
  }
}

// Main security scanning function
async function scanRepository(
  repoName: string, 
  branch: string = "main"
): Promise<ScanResult> {
  // Initialize scan result
  const scanId = crypto.randomUUID();
  const scanResult: ScanResult = {
    repo_name: repoName,
    scan_id: scanId,
    lastCommitSha: await getLatestCommitSHA(repoName, branch) || undefined,
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

  try {
    // Fetch repository content
    let repoContent = await fetchRepositoryContent(repoName, branch);

    // Check if we have any content to scan
    if (!repoContent || repoContent.length === 0) {
      logger.warn(`No content found for repository: ${repoName}:${branch}. Check if the repository exists and is accessible.`);
      repoContent = [];
    }
    
    // Check if we can do incremental scanning
    const lastScanSHA = await getLastScanSHA(repoName);
    if (lastScanSHA && lastScanSHA === scanResult.lastCommitSha) {
      console.log(`No changes detected since last scan (SHA: ${lastScanSHA}). Returning previous results.`);
      
      // Get the latest scan results
      const previousScans = await getHistoricalScans(repoName, 1);
      if (previousScans.length > 0) {
        // Update timestamp and scan ID
        const previousScan = previousScans[0];
        previousScan.timestamp = new Date().toISOString();
        previousScan.scan_id = scanId;
        
        return previousScan;
      }
    }
    
    // If we get here, we need to do a full scan
    if (repoContent) {
      scanResult.statistics.files_scanned = repoContent.length;
    }

    // Run security checks
    const secretsFindings = await scanForSecrets(repoContent);
    const dependencyFindings = await scanDependencies(repoContent);
    const configFindings = await analyzeConfigurations(repoContent);
    const patternFindings = await detectVulnerabilityPatterns(repoContent);

    // Combine all findings
    scanResult.findings = [
      ...secretsFindings,
      ...dependencyFindings,
      ...configFindings,
      ...patternFindings
    ];

    // Enhance dependency findings with web search
    scanResult.findings = await enhanceDependencyFindings(scanResult.findings);

    // Update statistics
    scanResult.findings.forEach(finding => {
      scanResult.statistics.issues_by_severity[finding.severity]++;
    });
    
    // Calculate security trends
    scanResult.statistics.trends = await calculateSecurityTrends(repoName, scanResult);

    // Store scan results in vector store
    const vectorStoreId = await getOrCreateVectorStore(repoName);
    
    // Store the full scan result
    const scanResultFile = new File(
      [JSON.stringify(scanResult, null, 2)],
      `scan-result-${scanId}.json`,
      { type: 'application/json' }
    );
    
    const uploadedFile = await openai.files.create({
      file: scanResultFile,
      purpose: "assistants"
    });
    
    await openai.vectorStores.files.create(vectorStoreId, {
      file_id: uploadedFile.id
    });
    
    // Store individual findings for better vector search
    await storeSecurityFindings(vectorStoreId, scanResult.findings);

    // Create GitHub issues for critical and high severity findings
    if (scanResult.findings.some(f => f.severity === 'critical' || f.severity === 'high')) {
      await createGitHubIssues(repoName, scanResult.findings.filter(
        f => f.severity === 'critical' || f.severity === 'high'
      ));
    }

    return scanResult;
  } catch (error) {
    console.error("Error scanning repository:", error);
    throw error;
  }
}



// Generate HTML content for the security report
function generateReportHtml(
  scanResult: ScanResult,
  includeRecommendations: boolean
): string {
  // Count issues by severity
  const criticalCount = scanResult.statistics.issues_by_severity.critical || 0;
  const highCount = scanResult.statistics.issues_by_severity.high || 0;
  const mediumCount = scanResult.statistics.issues_by_severity.medium || 0;
  const lowCount = scanResult.statistics.issues_by_severity.low || 0;
  
  // Generate HTML for the report
  let html = `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
      <h1 style="color: #333;">Security Scan Report: ${scanResult.repo_name}</h1>
      <p style="color: #666;">Scan completed on: ${new Date(scanResult.timestamp).toLocaleString()}</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h2 style="margin-top: 0;">Summary</h2>
        <p>Files scanned: <strong>${scanResult.statistics.files_scanned}</strong></p>
        <p>Issues found: <strong>${scanResult.findings.length}</strong></p>
        <ul>
          <li style="color: ${criticalCount > 0 ? '#d32f2f' : '#666'};">Critical: <strong>${criticalCount}</strong></li>
          <li style="color: ${highCount > 0 ? '#f57c00' : '#666'};">High: <strong>${highCount}</strong></li>
          <li style="color: ${mediumCount > 0 ? '#fbc02d' : '#666'};">Medium: <strong>${mediumCount}</strong></li>
          <li style="color: ${lowCount > 0 ? '#7cb342' : '#666'};">Low: <strong>${lowCount}</strong></li>
        </ul>
      </div>
  `;
  
  // Add critical and high findings
  const criticalAndHighFindings = scanResult.findings.filter(
    f => f.severity === 'critical' || f.severity === 'high'
  );
  
  if (criticalAndHighFindings.length > 0) {
    html += `
      <h2 style="color: #d32f2f;">Critical & High Priority Issues</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="background-color: #f5f5f5;">
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Severity</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Category</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">File</th>
          <th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Description</th>
        </tr>
    `;
    
    for (const finding of criticalAndHighFindings) {
      const severityColor = finding.severity === 'critical' ? '#d32f2f' : '#f57c00';
      
      html += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; color: ${severityColor}; font-weight: bold;">${finding.severity.toUpperCase()}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${finding.category}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${finding.file}${finding.line_number ? `:${finding.line_number}` : ''}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${finding.description}</td>
        </tr>
      `;
      
      if (includeRecommendations) {
        html += `
          <tr>
            <td colspan="4" style="padding: 8px; border: 1px solid #ddd; background-color: #f9f9f9;">
              <strong>Recommendation:</strong> ${finding.recommendation}
            </td>
          </tr>
        `;
      }
    }
    
    html += `</table>`;
  }
  
  // Add medium and low findings summary
  const mediumAndLowFindings = scanResult.findings.filter(
    f => f.severity === 'medium' || f.severity === 'low'
  );
  
  if (mediumAndLowFindings.length > 0) {
    html += `
      <h2 style="color: #666; margin-top: 30px;">Medium & Low Priority Issues</h2>
      <p>There are ${mediumAndLowFindings.length} medium and low priority issues.</p>
    `;
    
    // Group by category
    const categoryCounts: Record<string, number> = {};
    for (const finding of mediumAndLowFindings) {
      categoryCounts[finding.category] = (categoryCounts[finding.category] || 0) + 1;
    }
    
    html += `
      <ul>
    `;
    
    for (const [category, count] of Object.entries(categoryCounts)) {
      html += `
        <li>${category}: ${count} issues</li>
      `;
    }
    
    html += `
      </ul>
    `;
  }
  
  // Add footer
  html += `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999;">
        <p>This is an automated security report generated by the Security Scanner.</p>
        <p>Scan ID: ${scanResult.scan_id}</p>
      </div>
    </div>
  `;
  
  return html;
}

// Rate limiting implementation
const requestCounts: Record<string, { count: number, resetTime: number }> = {};

function checkRateLimit(path: string, clientIp: string): boolean {
  const limit = rateLimits[path];
  if (!limit) return true; // No rate limit for this path
  
  const key = `${path}:${clientIp}`;
  const now = Date.now();
  
  // Initialize or reset if window has passed
  if (!requestCounts[key] || requestCounts[key].resetTime < now) {
    requestCounts[key] = {
      count: 1,
      resetTime: now + limit.windowMs
    };
    return true;
  }
  
  // Increment count and check against limit
  requestCounts[key].count++;
  
  // If over limit, return false
  if (requestCounts[key].count > limit.maxRequests) {
    return false;
  }
  
  return true;
}

// Function to get raw JSON from vector store for debugging
async function getRawJsonFromVectorStore(repoName: string): Promise<string[]> {
  try {
    // Get vector store for the repository
    const vectorStoreId = await getOrCreateVectorStore(repoName);
    
    // Search for scan results
    const searchResponse = await openai.vectorStores.search(vectorStoreId, {
      query: "scan results",
      max_num_results: 10
    });
    
    // Collect raw JSON strings
    const rawJsonStrings: string[] = [];
    
    for (const result of searchResponse.data) {
      try {
        if (result.content && result.content[0]?.text) {
          // Get the raw JSON text from the result
          const jsonText = result.content[0].text;
          rawJsonStrings.push(jsonText);
          
          // Log the JSON text for debugging
          logger.info(`Raw JSON length: ${jsonText.length}`);
          
          // Log problematic areas if JSON is long
          if (jsonText.length > 2000) {
            // Log specific areas that might be problematic
            const positions = [40, 2706]; // Positions from error messages
            
            for (const pos of positions) {
              if (jsonText.length > pos) {
                const start = Math.max(0, pos - 100);
                const end = Math.min(jsonText.length, pos + 100);
                logger.info(`JSON around position ${pos}: ${jsonText.substring(start, end)}`);
              }
            }
          }
        }
      } catch (error) {
        logger.error("Error processing raw JSON result:", error);
      }
    }
    
    return rawJsonStrings;
  } catch (error) {
    console.error("Error getting raw JSON from vector store:", error);
    return [];
  }
}

// Main serve function
serve(async (req) => {
  
  // CORS handling
  logger.info(`Received request: ${req.method} ${req.url}`);
  
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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
    
    // Check rate limit
    if (!checkRateLimit(path, clientIp)) {
      logger.warn(`Rate limit exceeded for ${path} by ${clientIp}`);
      return new Response(JSON.stringify({ 
        error: "Rate limit exceeded. Please try again later." 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Route handling
    logger.info(`Processing request for endpoint: ${path}`);
    switch (path) {
      case "init-scan": {
        // Initialize scan for a repository
        const { repo } = await req.json();
        if (!repo) {
          throw new Error("Repository name is required");
        }
        logger.info(`Initializing scan for repository: ${repo}`);
        
        const vectorStoreId = await createRepoVectorStore(repo);
        return new Response(JSON.stringify({ vectorStoreId }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "scan-repo": {
        // Run a full security scan
        const { repo, branch = "main" } = await req.json();
        if (!repo) {
          throw new Error("Repository name is required");
        }
        logger.info(`Running full security scan for ${repo}:${branch}`);
        
        const scanResult = await scanRepository(repo, branch);
        return new Response(JSON.stringify(scanResult), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "scan-results": {
        // Get historical scan results
        const { repo, limit = 10 } = await req.json();
        if (!repo) {
          throw new Error("Repository name is required");
        }
        logger.info(`Getting historical scan results for ${repo} (limit: ${limit})`);
        
        const results = await getHistoricalScans(repo, limit);
        return new Response(JSON.stringify({ results }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "create-issues": {
        // Create GitHub issues for findings
        const { repo, findings } = await req.json();
        if (!repo || !findings || !Array.isArray(findings)) {
          throw new Error("Repository name and findings array are required");
        }
        logger.info(`Creating GitHub issues for ${findings.length} findings in ${repo}`);
        
        const issueResults = await createGitHubIssues(repo, findings);
        return new Response(JSON.stringify(issueResults), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "cron-trigger": {
        // Endpoint for GitHub Actions to trigger scans
        const { repo, branch = "main", sendReport = false, recipient } = await req.json();
        if (!repo) {
          throw new Error("Repository name is required");
        }
        logger.info(`Received cron trigger for ${repo}:${branch}, sendReport=${sendReport}`);
        
        const scanId = crypto.randomUUID();
        
        // Queue the scan to run asynchronously
        scanRepository(repo, branch)
          .then(async (scanResult) => {
            // Send report if requested
            if (sendReport && recipient) {
              await sendSecurityReportEmail(repo, recipient, await getHistoricalScans(repo));
            }
          })
          .catch(console.error);
        
        return new Response(JSON.stringify({ scanId, message: "Scan queued successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "send-report": {
        // Send a security report via email
        const { repo, recipient, includeRecommendations = true } = await req.json();
        if (!repo || !recipient) {
          throw new Error("Repository name and recipient email are required");
        }
        logger.info(`Sending security report for ${repo} to ${recipient}`);
        
        // Get the latest scan results
        const scanResults = await getHistoricalScans(repo);
        if (scanResults.length === 0) {
          logger.error(`No scan results found for repository: ${repo}. You may need to run a scan first using the scan-repo endpoint.`);
          return new Response(JSON.stringify({ success: false, message: "No scan results found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const success = await sendSecurityReportEmail(repo, recipient, scanResults, includeRecommendations);
        
        if (success) {
          return new Response(JSON.stringify({ 
            success: true, 
            message: "Security report sent successfully" 
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        } else {
          return new Response(JSON.stringify({ 
            success: false, 
            message: "Failed to send security report" 
          }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }
      
      case "json_raw": {
        // Get raw JSON for debugging
        const { repo } = await req.json();
        if (!repo) {
          throw new Error("Repository name is required");
        }
        logger.info(`Getting raw JSON for repository: ${repo}`);
        
        // Get raw JSON strings without parsing
        const rawJsonStrings = await getRawJsonFromVectorStore(repo);
        
        // Return the raw JSON strings
        return new Response(JSON.stringify({ 
          count: rawJsonStrings.length,
          raw_json: rawJsonStrings
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        logger.error(`Unknown path: ${path}`);
        throw new Error(`Unknown path: ${path}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    logger.error(`Request error: ${errorMessage}`, error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}, { port: 8001 });  // Use port 8001 instead of the default
