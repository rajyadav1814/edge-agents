import { MCPTool, Context } from '../../types';
import { OpenAI } from 'openai';

export class ResearchTool implements MCPTool {
  name = 'research';
  description = 'Research a topic using web search and create detailed reports';
  inputSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'The research query or topic'
      },
      depth: {
        type: 'string',
        description: 'Depth of research (brief, detailed, comprehensive)',
        enum: ['brief', 'detailed', 'comprehensive']
      },
      focus_areas: {
        type: 'array',
        items: { type: 'string' },
        description: 'Specific areas to focus on within the topic'
      }
    },
    required: ['query']
  };

  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async execute(params: {
    query: string;
    depth?: string;
    focus_areas?: string[];
  }, context: Context): Promise<any> {
    try {
      // Track research initiation
      context.trackAction('research_started');
      context.remember(`research_${Date.now()}`, {
        topic: params.query,
        depth: params.depth || 'detailed'
      });

      // Construct research prompt
      const prompt = this.constructResearchPrompt(params);

      // Use GPT-4 with web search to conduct research
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-search-preview',
        web_search_options: {
          search_context_size: "high"
        },
        messages: [
          {
            role: 'system',
            content: 'You are a research expert that creates detailed, well-structured reports. Include citations and organize information clearly.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: params.depth === 'comprehensive' ? 4000 : 2000
      });

      const report = response.choices[0].message.content;

      // Format the report with sections
      const formattedReport = this.formatReport(report, params);

      // Track research completion
      context.trackAction('research_completed');

      return {
        report: formattedReport,
        metadata: {
          topic: params.query,
          depth: params.depth || 'detailed',
          focus_areas: params.focus_areas || [],
          timestamp: new Date().toISOString()
        }
      };
    } catch (error: unknown) {
      console.error('Research error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Research failed: ${errorMessage}`);
    }
  }

  private constructResearchPrompt(params: {
    query: string;
    depth?: string;
    focus_areas?: string[];
  }): string {
    let prompt = `Research the following topic: ${params.query}\n\n`;

    if (params.depth) {
      prompt += `Provide a ${params.depth} analysis.\n`;
    }

    if (params.focus_areas && params.focus_areas.length > 0) {
      prompt += `\nFocus specifically on the following areas:\n`;
      params.focus_areas.forEach(area => {
        prompt += `- ${area}\n`;
      });
    }

    prompt += `\nPlease include:\n`;
    prompt += `1. An executive summary\n`;
    prompt += `2. Key findings and insights\n`;
    prompt += `3. Detailed analysis\n`;
    prompt += `4. Citations and sources\n`;
    prompt += `5. Recommendations or next steps if applicable\n`;

    return prompt;
  }

  private formatReport(report: string | null, params: {
    query: string;
    depth?: string;
  }): string {
    if (!report) {
      return 'No research results available.';
    }

    const header = `
Research Report
Topic: ${params.query}
Depth: ${params.depth || 'detailed'}
Date: ${new Date().toISOString()}
${'-'.repeat(50)}

`;

    return header + report;
  }
}
