import { ResearchTool } from '../mcp/tools/research';
import { Context } from '../types';
import { OpenAI } from 'openai';

// Mock OpenAI
jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => {
      return {
        chat: {
          completions: {
            create: jest.fn().mockImplementation((config) => {
              // Check that temperature is not present in the config
              if ('temperature' in config) {
                throw new Error('Model incompatible request argument supplied: temperature');
              }
              
              return Promise.resolve({
                choices: [
                  {
                    message: {
                      content: 'Mocked research response'
                    }
                  }
                ]
              });
            })
          }
        }
      };
    })
  };
});

// Mock Context
const mockContext: Context = {
  trackAction: jest.fn(),
  remember: jest.fn(),
  getWorkflowId: jest.fn().mockReturnValue('test-workflow'),
  setState: jest.fn(),
  getState: jest.fn()
};

describe('ResearchTool', () => {
  let researchTool: ResearchTool;
  
  beforeEach(() => {
    jest.clearAllMocks();
    researchTool = new ResearchTool('fake-api-key');
  });
  
  it('should execute research without temperature parameter', async () => {
    const params = {
      query: 'What are the latest developments in AI in 2025?',
      depth: 'brief'
    };
    
    const result = await researchTool.execute(params, mockContext);
    
    // Verify that the research was executed successfully
    expect(result).toBeDefined();
    expect(result.report).toContain('Mocked research response');
    expect(result.metadata.topic).toBe(params.query);
    expect(result.metadata.depth).toBe(params.depth);
    
    // Verify that context methods were called
    expect(mockContext.trackAction).toHaveBeenCalledWith('research_started');
    expect(mockContext.trackAction).toHaveBeenCalledWith('research_completed');
    expect(mockContext.remember).toHaveBeenCalled();
  });
  
  it('should throw an error if temperature is included', async () => {
    // This test is redundant since our mock will throw an error if temperature is present,
    // but it's included for clarity
    const params = {
      query: 'What are the latest developments in AI in 2025?',
      depth: 'brief'
    };
    
    // Force temperature to be included (this shouldn't happen with our implementation)
    const originalGetModelConfig = require('../../utils/model-config').getModelConfig;
    jest.mock('../../utils/model-config', () => ({
      getModelConfig: jest.fn().mockImplementation((config) => {
        return { ...config, temperature: 0.7 };
      })
    }));
    
    await expect(researchTool.execute(params, mockContext)).rejects.toThrow(
      'Research failed: Model incompatible request argument supplied: temperature'
    );
    
    // Restore original implementation
    jest.mock('../../utils/model-config', () => ({
      getModelConfig: originalGetModelConfig
    }));
  });
});
