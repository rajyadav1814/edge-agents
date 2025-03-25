import { AnalyzeParams, MCPTool, Context, AnalysisResult } from '../../types/index.js';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { OpenAI } from 'openai/index.mjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Tool for analyzing code files for issues and improvements
 */
export class AnalyzeTool implements MCPTool {
  public name: string = 'analyze';
  public description: string = 'Analyze code files for issues and improvements';
  public inputSchema: object = {
    type: 'object',
    required: ['files'],
    properties: {
      files: {
        type: 'array',
        items: { type: 'string' },
        description: 'Array of file paths to analyze'
      },
      output: {
        type: 'string',
        description: 'Path to output file for analysis results'
      },
      model: {
        type: 'string',
        description: 'Model to use for analysis'
      },
      mode: {
        type: 'string',
        enum: ['automatic', 'semi', 'manual', 'custom'],
        description: 'Execution mode'
      },
      diff_mode: {
        type: 'string',
        enum: ['file', 'function'],
        description: 'Diff tracking mode'
      },
      processing: {
        type: 'string',
        enum: ['parallel', 'sequential', 'concurrent', 'swarm'],
        description: 'Processing mode'
      }
    }
  };

  private openai: OpenAI;
  private defaultModel: string;
  private configPath: string;

  /**
   * Create a new AnalyzeTool
   * @param apiKey OpenAI API key
   * @param defaultModel Default model to use for analysis
   * @param configPath Path to the config file
   */
  constructor(apiKey: string, defaultModel: string, configPath: string) {
    this.openai = new OpenAI({ apiKey });
    this.defaultModel = defaultModel;
    this.configPath = configPath;
  }

  /**
   * Execute the analyze tool
   * @param params Tool parameters
   * @param context Execution context
   * @returns Analysis result
   */
  public async execute(params: AnalyzeParams, context: Context): Promise<AnalysisResult> {
    // Validate parameters
    if (!params.files || !Array.isArray(params.files) || params.files.length === 0) {
      throw new Error('Files parameter must be a non-empty array');
    }

    console.log(`Analyzing ${params.files.length} files...`);

    // Set default values for optional parameters
    const model = params.model || this.defaultModel;
    const mode = params.mode || this.loadFromConfig('execution.mode') || 'automatic';
    const diffMode = params.diff_mode || this.loadFromConfig('execution.diff_mode') || 'file';
    const processing = params.processing || this.loadFromConfig('execution.processing') || 'parallel';

    // Read file contents
    const fileContents: { [path: string]: string } = {};
    for (const filePath of params.files) {
      try {
        const content = readFileSync(filePath, 'utf8');
        fileContents[filePath] = content;
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw new Error(`Failed to read file ${filePath}`);
      }
    }

    // Create analysis prompt
    const prompt = this.createAnalysisPrompt(fileContents);

    // Run analysis with OpenAI
    const analysisResult = await this.runAnalysis(prompt, model);

    // Format the result
    const result: AnalysisResult = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      files: params.files,
      findings: this.parseFindings(analysisResult, fileContents),
      summary: this.extractSummary(analysisResult)
    };

    // Store result in context
    context.setResource('analysis_result', result);
    context.markCollected('analyzed_files');

    // Write to output file if specified
    if (params.output) {
      try {
        const fs = await import('fs');
        fs.writeFileSync(params.output, JSON.stringify(result, null, 2));
        console.log(`Analysis result written to ${params.output}`);
      } catch (error) {
        console.error(`Error writing analysis result to ${params.output}:`, error);
      }
    }

    return result;
  }

  /**
   * Create an analysis prompt from file contents
   * @param fileContents Map of file paths to contents
   * @returns Analysis prompt
   */
  private createAnalysisPrompt(fileContents: { [path: string]: string }): string {
    let prompt = `
You are a code analysis expert. Analyze the following code files and identify:
1. Bugs or logical errors
2. Performance issues
3. Security vulnerabilities
4. Code style and readability issues
5. Potential improvements

For each issue found, specify:
- The file path
- Line number(s) if applicable
- Issue type (bug, performance, security, style, other)
- Severity (low, medium, high, critical)
- Description of the issue
- Suggested fix or improvement

Files to analyze:

`;

    // Add file contents to prompt
    for (const [filePath, content] of Object.entries(fileContents)) {
      prompt += `\n--- FILE: ${filePath} ---\n${content}\n`;
    }

    prompt += `\n
Provide your analysis in the following format:

## FINDINGS
1. [FILE: file_path.ext] [TYPE: issue_type] [SEVERITY: severity]
   Line(s): line_number
   Issue: Description of the issue
   Suggestion: Recommended fix or improvement

2. [FILE: file_path.ext] [TYPE: issue_type] [SEVERITY: severity]
   ...

## SUMMARY
Brief overall assessment of the code and key recommendations.
`;

    return prompt;
  }

  /**
   * Run analysis with OpenAI
   * @param prompt Analysis prompt
   * @param model Model to use
   * @returns Analysis response
   */
  private async runAnalysis(prompt: string, model: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 2000
      });

      return completion.choices[0].message.content || '';
    } catch (error) {
      console.error('Error running analysis:', error);
      throw new Error('Failed to run analysis with OpenAI');
    }
  }

  /**
   * Parse findings from analysis response
   * @param analysisResponse Analysis response
   * @param fileContents File contents (for validation)
   * @returns Array of findings
   */
  private parseFindings(analysisResponse: string, fileContents: { [path: string]: string }): AnalysisResult['findings'] {
    const findings: AnalysisResult['findings'] = [];
    const findingsSection = analysisResponse.match(/## FINDINGS\n([\s\S]*?)(?=## SUMMARY|$)/);
    
    if (!findingsSection) {
      return findings;
    }

    const findingsText = findingsSection[1];
    const findingRegex = /\d+\.\s+\[FILE:\s+(.+?)\]\s+\[TYPE:\s+(.+?)\]\s+\[SEVERITY:\s+(.+?)\](?:\s+Line\(s\):\s+(.+?))?(?:\n\s*Issue:\s+(.+?))?(?:\n\s*Suggestion:\s+(.+?))?(?=\n\d+\.|\n*$)/g;
    
    let match;
    while ((match = findingRegex.exec(findingsText)) !== null) {
      const [_, file, type, severity, lineStr, message, suggestions] = match;
      
      // Validate file exists in the analyzed files
      if (!fileContents[file]) {
        continue;
      }
      
      // Parse line number(s)
      let line: number | undefined = undefined;
      if (lineStr) {
        const lineNum = parseInt(lineStr.trim(), 10);
        if (!isNaN(lineNum)) {
          line = lineNum;
        }
      }
      
      findings.push({
        type: this.normalizeType(type.trim()),
        file: file.trim(),
        line,
        message: (message || '').trim(),
        severity: this.normalizeSeverity(severity.trim()),
        suggestions: suggestions ? [suggestions.trim()] : []
      });
    }
    
    return findings;
  }

  /**
   * Extract summary from analysis response
   * @param analysisResponse Analysis response
   * @returns Summary text
   */
  private extractSummary(analysisResponse: string): string {
    const summarySection = analysisResponse.match(/## SUMMARY\n([\s\S]*?)(?=##|$)/);
    return summarySection ? summarySection[1].trim() : 'No summary provided.';
  }

  /**
   * Normalize issue type
   * @param type Raw issue type
   * @returns Normalized issue type
   */
  private normalizeType(type: string): 'bug' | 'performance' | 'security' | 'style' | 'other' {
    type = type.toLowerCase();
    
    if (type.includes('bug') || type.includes('error') || type.includes('logical')) {
      return 'bug';
    } else if (type.includes('performance') || type.includes('optimization')) {
      return 'performance';
    } else if (type.includes('security') || type.includes('vulnerability')) {
      return 'security';
    } else if (type.includes('style') || type.includes('readability')) {
      return 'style';
    } else {
      return 'other';
    }
  }

  /**
   * Normalize severity level
   * @param severity Raw severity level
   * @returns Normalized severity level
   */
  private normalizeSeverity(severity: string): 'low' | 'medium' | 'high' | 'critical' {
    severity = severity.toLowerCase();
    
    if (severity.includes('critical') || severity.includes('severe')) {
      return 'critical';
    } else if (severity.includes('high')) {
      return 'high';
    } else if (severity.includes('medium') || severity.includes('moderate')) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Load a configuration value from the config file
   * @param key Configuration key (dot notation)
   * @returns Configuration value or undefined if not found
   */
  private loadFromConfig(key: string): any {
    try {
      // Read and parse the config file
      const toml = require('toml');
      const fs = require('fs');
      const configContent = fs.readFileSync(this.configPath, 'utf8');
      const config = toml.parse(configContent);
      
      // Navigate the config object using the key
      return key.split('.').reduce((obj, part) => obj && obj[part], config);
    } catch (error) {
      console.error(`Error loading config value ${key}:`, error);
      return undefined;
    }
  }
}