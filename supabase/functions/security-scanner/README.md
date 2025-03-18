# Security Scanner Edge Function

The Security Scanner Edge Function provides automated security analysis for code repositories. By leveraging vector search capabilities and OpenAI's web search functionality, it identifies potential security vulnerabilities, tracks findings over time, and creates GitHub issues for critical problems.

## Features

- **Static Code Analysis**: Scans code for hardcoded secrets, insecure patterns
- **Dependency Scanning**: Checks for known vulnerabilities in dependencies (npm, Python, Ruby)
- **Configuration Analysis**: Validates security settings in config files
- **Pattern Matching**: Uses vector similarity to find known vulnerability patterns
- **Web Search Enhancement**: Uses OpenAI's web search to find latest CVEs
- **Historical Analysis**: Tracks security posture over time
- **GitHub Issues Integration**: Creates issues for critical and high severity findings
- **Integrated Email Reporting**: Sends detailed security reports via email using direct integration with the Resend API
- **Enhanced Logging**: Provides detailed logs for each step of the scanning process

## API Endpoints

1. `/init-scan`: Initialize a vector store for a repository
   ```
   POST /init-scan
   Body: { "repo": "owner/repo" }
   Returns: { "vectorStoreId": "vs_..." }
   ```

2. `/scan-repo`: Run a full security scan
   ```
   POST /scan-repo
   Body: { "repo": "owner/repo", "branch": "main" }
   Returns: ScanResult object
   ```

3. `/scan-results`: Get historical scan results
   ```
   POST /scan-results
   Body: { "repo": "owner/repo", "limit": 10 }
   Returns: { "results": ScanResult[] }
   ```

4. `/create-issues`: Create GitHub issues for findings
   ```
   POST /create-issues
   Body: { "repo": "owner/repo", "findings": SecurityFinding[] }
   Returns: { "created": number, "issues": string[] }
   ```

5. `/cron-trigger`: Endpoint for GitHub Actions to trigger nightly scans
   ```
   POST /cron-trigger
   Body: { "repo": "owner/repo", "branch": "main", "sendReport": true, "recipient": "user@example.com" }
   Returns: { "scanId": "scan_...", "message": "Scan queued successfully" }
   ```

6. `/send-report`: Send a security report via email
   ```
   POST /send-report
   Body: { "repo": "owner/repo", "recipient": "user@example.com", "includeRecommendations": true }
   Returns: { "success": true, "message": "Report sent successfully" }
   ```

## Logging

The function includes enhanced logging capabilities:
- Detailed logs for each step of the security scanning process
- Timestamps and log levels (INFO, WARN, ERROR, SUCCESS) for better debugging
- Performance metrics for request processing time
- Visibility into API calls and their responses

To use the enhanced logging version, deploy the `index-with-logging.ts` file instead of the standard `index.ts`.

## Environment Variables

- `OPENAI_API_KEY`: Required for OpenAI API access
- `GITHUB_TOKEN`: GitHub API token for repository access and issue creation
- `RESEND_API_KEY`: API key for the Resend email service

The function now uses direct integration with the Resend API through the email-service module, eliminating the need for Supabase URL and anonymous key environment variables that were previously required.
## GitHub Actions Integration

To set up automated nightly scans, add the following workflow file to your repository:

```yaml
# .github/workflows/security-scan.yml
name: Nightly Security Scan
on:
  schedule:
    - cron: '0 2 * * *'  # Run at 2 AM daily
  workflow_dispatch:     # Manual trigger option

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Security Scan
        run: |
          curl -X POST https://${{ secrets.SUPABASE_PROJECT_REF }}.functions.supabase.co/security-scanner/cron-trigger \
          -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
          -H "Content-Type: application/json" \
          --data '{"repo": "${{ github.repository }}", "branch": "main", "sendReport": true, "recipient": "security@example.com"}'
```

## Implementation Details

The function uses a comprehensive security analysis pipeline:

1. **Vector Store Integration**: Creates and manages repository-specific vector stores for security scans
2. **Security Analysis Pipeline**: Implements static code scanning, dependency scanning, configuration analysis, and pattern matching
3. **Web Search Enhancement**: Uses OpenAI's web search capabilities to enhance security analysis
4. **GitHub Actions Integration**: Integrates with GitHub Actions for automated scanning
5. **Email Notifications**: Sends detailed security reports via email

## Security Considerations

- All endpoints require proper authentication via Supabase JWT
- Rate limiting is implemented to prevent abuse
- Sensitive findings are stored securely in the vector database
- Security findings expire after 90 days by default
