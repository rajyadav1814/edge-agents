# Self-Correcting Code Analysis Function

A Supabase Edge Function that uses ReACT (Reasoning, Acting, and Reflecting) methodology to analyze and fix code with continuous self-improvement.

## Core Workflow

1. **Reasoning Phase**
   - Analyzes code structure and patterns
   - Identifies potential issues
   - Formulates hypotheses about improvements
   - Considers multiple solution paths

2. **Acting Phase**
   - Executes code analysis
   - Applies suggested fixes
   - Tests changes
   - Creates commits

3. **Reflecting Phase**
   - Evaluates results
   - Learns from failures
   - Adjusts strategies
   - Improves future analyses

## Usage

### Code Analysis with Self-Correction

```typescript
const response = await fetch("https://your-project.supabase.co/functions/v1/git-pull-fixer", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-token"
  },
  body: JSON.stringify({
    code: `
      function fibonacci(n) {
        if (n <= 1) return n;
        return fibonacci(n-1) + fibonacci(n-2);
      }
    `
  })
});

const result = await response.json();
```

The function will:
1. Analyze initial code
2. Identify issues
3. Propose solutions
4. Test improvements
5. Reflect and adjust
6. Repeat until optimal

### Pull Request Analysis

```typescript
const response = await fetch("https://your-project.supabase.co/functions/v1/git-pull-fixer", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-token"
  },
  body: JSON.stringify({
    owner: "user",
    repo: "project",
    prNumber: 123
  })
});
```

## Self-Correction Process

### 1. Initial Analysis
```typescript
// Thought: Analyze code structure
const issues = await analyzeCode(code);

// Action: Identify potential problems
const problems = issues.map(categorizeIssue);

// Reflection: Are all issues identified?
if (needsDeeperAnalysis(issues)) {
  await performDetailedScan(code);
}
```

### 2. Solution Generation
```typescript
// Thought: Consider multiple approaches
const solutions = await generateSolutions(problems);

// Action: Evaluate each solution
const rankedSolutions = solutions.map(evaluateSolution);

// Reflection: Are solutions optimal?
if (!meetsQualityThreshold(rankedSolutions)) {
  await generateAlternativeSolutions();
}
```

### 3. Implementation & Testing
```typescript
// Thought: Plan implementation
const steps = createImplementationPlan(bestSolution);

// Action: Apply changes
const result = await implementSolution(steps);

// Reflection: Verify improvements
if (!passesAllTests(result)) {
  await adjustAndRetry(steps);
}
```

## Configuration

### Environment Variables
```bash
# Required
OPENAI_API_KEY=sk-...
GITHUB_TOKEN=ghp_...
EDGE_FUNCTION_URL=https://...

# Optional
DEBUG_MODE=true           # Enable detailed logging
MAX_RETRIES=3            # Maximum self-correction attempts
ANALYSIS_DEPTH=high      # Analysis detail level
```

### Self-Correction Settings
```json
{
  "selfCorrection": {
    "maxRetries": 3,
    "learningRate": 0.1,
    "qualityThreshold": 0.95,
    "timeoutSeconds": 30
  },
  "analysis": {
    "depth": "high",
    "coverage": ["syntax", "logic", "performance", "security"],
    "autoFix": true
  }
}
```

## Error Recovery

The function implements self-healing error handling:

1. **Detection**
   ```typescript
   try {
     await analyze();
   } catch (error) {
     // Thought: What caused this error?
     const diagnosis = await diagnoseError(error);
     
     // Action: Apply recovery strategy
     const recovery = await recoverFromError(diagnosis);
     
     // Reflection: How to prevent this?
     await updateErrorPrevention(diagnosis);
   }
   ```

2. **Recovery**
   ```typescript
   // Thought: Can we recover?
   if (isRecoverable(error)) {
     // Action: Try alternative approach
     await attemptRecovery();
     
     // Reflection: Document learning
     await updateRecoveryStrategies();
   }
   ```

## Development

### Local Setup
```bash
# Clone and install
git clone https://github.com/your-org/git-pull-fixer
cd git-pull-fixer
npm install

# Configure environment
cp example.env .env
# Edit .env with your credentials

# Run locally
supabase functions serve git-pull-fixer --env-file .env
```

### Testing
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e