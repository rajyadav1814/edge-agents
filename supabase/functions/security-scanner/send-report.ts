/**
 * Security Scanner - Email Report Sender
 * 
 * This module handles sending security reports via email using the email-service.ts module.
 */

import { sendEmail } from "./email-service.ts";
import { logger } from "./logger.ts";

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

/**
 * Sends a security report via email
 * 
 * @param repoName Repository name
 * @param recipient Recipient email address
 * @param scanResults Array of scan results (usually just the latest one)
 * @param includeRecommendations Whether to include recommendations in the report
 * @returns Promise<boolean> Success status
 */
export async function sendSecurityReport(
  repoName: string,
  recipient: string,
  scanResults: ScanResult[],
  includeRecommendations: boolean = true
): Promise<boolean> {
  logger.info(`Preparing security report for ${repoName} to send to ${recipient}...`);
  
  try {
    if (!scanResults || scanResults.length === 0) {
      logger.error(`No scan results found for repository: ${repoName}`);
      return false;
    }
    
    // Combine all findings from scan results into a single comprehensive report
    const latestScan: ScanResult = {
      repo_name: repoName,
      scan_id: scanResults[0].scan_id || crypto.randomUUID(),
      timestamp: scanResults[0].timestamp || new Date().toISOString(),
      findings: [] as SecurityFinding[],
      statistics: {
        files_scanned: 0,
        issues_by_severity: {
          critical: 0, high: 0, medium: 0, low: 0
        },
        trends: {}
      }
    };
    
    // Collect all findings from all scan results
    for (const scan of scanResults) {
      if (scan.findings && Array.isArray(scan.findings)) {
        latestScan.findings.push(...scan.findings);
        
        // Update statistics
        if (scan.statistics && scan.statistics.files_scanned) {
          latestScan.statistics.files_scanned += scan.statistics.files_scanned;
        }
      }
    }
    
    // Recalculate severity counts
    for (const finding of latestScan.findings) {
      if (finding.severity) {
        latestScan.statistics.issues_by_severity[finding.severity] = 
          (latestScan.statistics.issues_by_severity[finding.severity] || 0) + 1;
      }
    }
    
    logger.info(`Found scan result from ${latestScan.timestamp} with ${latestScan.findings.length} findings`);
    
    // Generate HTML content for the email
    logger.info(`Generating HTML report...`);
    const htmlContent = generateReportHtml(latestScan, includeRecommendations);
    
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

/**
 * Generates HTML content for the security report
 * 
 * @param scanResult Scan result to generate report for
 * @param includeRecommendations Whether to include recommendations in the report
 * @returns HTML content for the email
 */
export function generateReportHtml(
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
