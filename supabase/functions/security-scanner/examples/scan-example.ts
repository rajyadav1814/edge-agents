/**
 * Example script demonstrating how to use the security scanner with enhanced logging
 * 
 * This script shows how to scan a GitHub repository for security issues
 * and displays the detailed logs of the scanning process.
 */

// Import the logger
import { logger } from "../logger.ts";

// Main function to demonstrate security scanning
async function runSecurityScan() {
  const repoName = "example-org/example-repo";
  const branch = "main";
  
  logger.info("=== Security Scanner Example ===");
  logger.info(`Scanning repository: ${repoName}:${branch}`);
  
  try {
    // Step 1: Initialize the scan
    logger.info("Step 1: Initializing scan...");
    const initResponse = await fetch("https://your-project.supabase.co/functions/v1/security-scanner/init-scan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({ repo: repoName })
    });
    
    if (!initResponse.ok) {
      throw new Error(`Failed to initialize scan: ${initResponse.statusText}`);
    }
    
    const { vectorStoreId } = await initResponse.json();
    logger.success(`Scan initialized with vector store ID: ${vectorStoreId}`);
    
    // Step 2: Run the security scan
    logger.info("Step 2: Running security scan...");
    const startTime = Date.now();
    
    const scanResponse = await fetch("https://your-project.supabase.co/functions/v1/security-scanner/scan-repo", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({ repo: repoName, branch })
    });
    
    if (!scanResponse.ok) {
      throw new Error(`Failed to run scan: ${scanResponse.statusText}`);
    }
    
    const scanResult = await scanResponse.json();
    const endTime = Date.now();
    logger.success(`Scan completed in ${(endTime - startTime) / 1000} seconds`);
    
    // Step 3: Display scan results
    logger.info("Step 3: Displaying scan results...");
    logger.info(`Files scanned: ${scanResult.statistics.files_scanned}`);
    logger.info(`Issues found: ${scanResult.findings.length}`);
    
    // Display issues by severity
    const { issues_by_severity } = scanResult.statistics;
    logger.info("Issues by severity:");
    logger.info(`- Critical: ${issues_by_severity.critical}`);
    logger.info(`- High: ${issues_by_severity.high}`);
    logger.info(`- Medium: ${issues_by_severity.medium}`);
    logger.info(`- Low: ${issues_by_severity.low}`);
    
    // Display critical and high findings
    const criticalAndHighFindings = scanResult.findings.filter(
      f => f.severity === 'critical' || f.severity === 'high'
    );
    
    if (criticalAndHighFindings.length > 0) {
      logger.warn(`Found ${criticalAndHighFindings.length} critical/high severity issues:`);
      
      for (const finding of criticalAndHighFindings) {
        logger.warn(`[${finding.severity.toUpperCase()}] ${finding.category} in ${finding.file}${finding.line_number ? `:${finding.line_number}` : ''}`);
        logger.info(`Description: ${finding.description}`);
        logger.info(`Recommendation: ${finding.recommendation}`);
        if (finding.cve_ids && finding.cve_ids.length > 0) {
          logger.info(`CVEs: ${finding.cve_ids.join(', ')}`);
        }
        logger.info("---");
      }
    } else {
      logger.success("No critical or high severity issues found!");
    }
    
    // Step 4: Send a report (optional)
    if (criticalAndHighFindings.length > 0) {
      logger.info("Step 4: Sending security report...");
      const recipient = "security@example.com";
      
      const reportResponse = await fetch("https://your-project.supabase.co/functions/v1/security-scanner/send-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
        },
        body: JSON.stringify({ 
          repo: repoName, 
          recipient,
          includeRecommendations: true
        })
      });
      
      if (reportResponse.ok) {
        logger.success(`Security report sent to ${recipient}`);
      } else {
        logger.error(`Failed to send security report: ${reportResponse.statusText}`);
      }
    }
    
    logger.success("=== Security scan example completed ===");
  } catch (error) {
    logger.error("Error during security scan:", error);
  }
}

// Run the example
runSecurityScan().catch(error => {
  logger.error("Unhandled error:", error);
  Deno.exit(1);
});