# E2B Code Interpreter API for Deno

E2B Code Interpreter provides a secure sandbox environment for executing code in AI applications. Here's the complete API reference for using E2B with Deno:

## Installation and Setup

```typescript
// Import from npm via URL (Deno approach)
import { CodeInterpreter } from "npm:@e2b/code-interpreter";

// API key configuration
const apiKey = Deno.env.get("E2B_API_KEY");
const sandbox = await CodeInterpreter.create({ apiKey });
```

## Core API Methods

### Sandbox Creation and Management

```typescript
// Create a new sandbox instance
const sandbox = await CodeInterpreter.create({
  apiKey: Deno.env.get("E2B_API_KEY"),
  // Optional: Specify Python or JavaScript kernel
  kernelName: "python", // or "javascript"
});

// Close the sandbox when done
await sandbox.close();

// Using with try/finally pattern
try {
  const sandbox = await CodeInterpreter.create();
  // Use sandbox...
} finally {
  await sandbox.close();
}
```

### Code Execution

```typescript
// Basic code execution
await sandbox.notebook.execCell('x = 1');
const execution = await sandbox.notebook.execCell('x += 1; x');
console.log(execution.text); // Outputs "2"

// JavaScript execution
const jsExecution = await sandbox.notebook.execCell(`
  const data = [1, 2, 3, 4];
  const sum = data.reduce((a, b) => a + b, 0);
  sum;
`);
console.log(jsExecution.text); // Outputs "10"

// Python execution with visualization
await sandbox.notebook.execCell(`
  import matplotlib.pyplot as plt
  import numpy as np
  
  x = np.linspace(0, 20, 100)
  y = np.sin(x)
  plt.plot(x, y)
  plt.show()
`);
```

### Output Streaming

```typescript
// Stream stdout and stderr in real-time
const execution = await sandbox.notebook.execCell(`
  import time
  for i in range(5):
      print(f"Processing item {i}")
      time.sleep(1)
`, {
  onStdout: (msg) => console.log(`[stdout] ${msg}`),
  onStderr: (msg) => console.error(`[stderr] ${msg}`),
  onResult: (result) => console.log(`[result] ${result.text}`)
});
```

### File System Operations

```typescript
// Write file to sandbox
await sandbox.filesystem.write("/home/user/data.txt", "Hello, World!");

// Read file from sandbox
const fileContent = await sandbox.filesystem.read("/home/user/data.txt");
console.log(fileContent); // Outputs "Hello, World!"

// List directory contents
const files = await sandbox.filesystem.list("/home/user");
console.log(files);

// Upload file to sandbox
const fileData = await Deno.readFile("./local_data.csv");
const uploadPath = await sandbox.uploadFile(fileData, "data.csv");
console.log(`File uploaded to ${uploadPath}`);
```

### Package Management

```typescript
// Install Python packages
await sandbox.notebook.execCell("!pip install pandas matplotlib");

// Install npm packages (for JavaScript kernel)
await sandbox.notebook.execCell("!npm install lodash axios");
```

## Advanced API Usage

### Working with Results

```typescript
const execution = await sandbox.notebook.execCell(`
  import matplotlib.pyplot as plt
  import pandas as pd
  
  df = pd.DataFrame({'A': [1, 2, 3], 'B': [4, 5, 6]})
  display(df)
  
  plt.figure(figsize=(10, 6))
  plt.plot(df['A'], df['B'], 'o-')
  plt.title('Simple Plot')
  plt.show()
`);

// Access execution results
console.log(execution.text);      // Text output
console.log(execution.error);     // Error information if execution failed
console.log(execution.logs);      // {stdout: string[], stderr: string[]}

// Handle different result types
execution.results.forEach(result => {
  if (result.type === 'image/png') {
    console.log('Chart image data:', result.base64);
  } else if (result.type === 'application/json') {
    console.log('JSON data:', result.json);
  } else if (result.type === 'text/html') {
    console.log('HTML content:', result.html);
  }
});
```

### Complete Example: Data Analysis

```typescript
import { CodeInterpreter } from "npm:@e2b/code-interpreter";

async function analyzeData() {
  const sandbox = await CodeInterpreter.create({
    apiKey: Deno.env.get("E2B_API_KEY")
  });
  
  try {
    // Upload dataset
    const csvData = await Deno.readFile("./titanic.csv");
    await sandbox.uploadFile(csvData, "titanic.csv");
    
    // Install dependencies
    await sandbox.notebook.execCell("!pip install pandas matplotlib seaborn scikit-learn");
    
    // Perform analysis
    const analysis = await sandbox.notebook.execCell(`
      import pandas as pd
      import matplotlib.pyplot as plt
      import seaborn as sns
      
      # Load data
      df = pd.read_csv('/home/user/titanic.csv')
      
      # Basic statistics
      print("Dataset shape:", df.shape)
      print("\\nBasic statistics:")
      print(df.describe())
      
      # Survival by gender
      plt.figure(figsize=(10, 6))
      sns.countplot(x='Sex', hue='Survived', data=df)
      plt.title('Survival by Gender')
      plt.show()
      
      # Age distribution
      plt.figure(figsize=(10, 6))
      sns.histplot(df['Age'].dropna(), kde=True)
      plt.title('Age Distribution')
      plt.show()
      
      # Return summary
      f"Dataset contains {df.shape[0]} passengers with {df['Survived'].sum()} survivors ({df['Survived'].mean()*100:.1f}% survival rate)"
    `, {
      onStdout: (msg) => console.log(msg)
    });
    
    return {
      text: analysis.text,
      visualizations: analysis.results.filter(r => r.type === 'image/png').map(r => r.base64),
      success: !analysis.error
    };
  } finally {
    await sandbox.close();
  }
}

// Run the analysis
const result = await analyzeData();
console.log(result.text);
```

## Working with Interactive Environments

```typescript
// Create a web server in the sandbox
await sandbox.filesystem.write("/home/user/server.js", `
  const http = require('http');
  
  const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('Hello from E2B sandbox!');
  });
  
  server.listen(3000, () => {
    console.log('Server running at http://localhost:3000/');
  });
`);

// Run the server
await sandbox.notebook.execCell("node /home/user/server.js &");

// Access the running service
const port = 3000;
const process = await sandbox.process.start({
  cmd: "curl localhost:3000"
});
console.log(await process.wait());
```

## Error Handling

```typescript
try {
  const execution = await sandbox.notebook.execCell("print(undefined_variable)");
  
  if (execution.error) {
    console.error("Code execution error:", execution.error.value);
    console.error("Error type:", execution.error.type);
  }
} catch (err) {
  console.error("Sandbox operation error:", err);
}
```

Remember to handle API keys securely when working with Deno and utilize the appropriate error handling patterns for production applications. E2B's Code Interpreter offers a powerful environment for executing untrusted code safely within AI applications.

Citations:
[1] https://e2b.dev
[2] https://e2b.dev/docs/legacy/code-interpreter/installation
[3] https://github.com/e2b-dev/E2B/issues/284
[4] https://e2b.dev/blog/typescript-code-interpreter-with-o1-and-gpt-4o
[5] https://e2b.dev/docs/legacy/code-interpreter/examples
[6] https://e2b.dev/blog/launching-the-code-interpreter-sdk
[7] https://e2b.dev/blog/guide-to-ai-developer-that-makes-pull-requests-for-you
[8] https://github.com/e2b-dev/code-interpreter
[9] https://e2b.dev/docs/sdk-reference
[10] https://e2b.dev/docs
[11] https://www.npmjs.com/package/e2b/v/0.16.2-beta.55?activeTab=versions
[12] https://pypi.org/project/e2b-code-interpreter/
[13] https://github.com/e2b-dev/llm-code-interpreter
[14] https://e2b.dev/docs/quickstart
[15] https://www.linkedin.com/posts/frank-ezenwanne_comparing-celery-in-python-to-the-javascript-activity-7223620239656120321-wnc0
[16] https://news.ycombinator.com/item?id=40093257
[17] https://github.com/e2b-dev/code-interpreter/activity
[18] https://github.com/e2b-dev/e2b-cookbook
[19] https://socket.dev/npm/package/e2b/overview/0.16.2-grpc.7
[20] https://til.simonwillison.net/llms/code-interpreter-expansions
[21] https://www.latent.space/p/code-interpreter
[22] https://github.com/e2b-dev/e2b-cookbook/blob/main/examples/codestral-code-interpreter-python/codestral_code_interpreter.ipynb
[23] https://e2b.dev/docs/code-interpreting/analyze-data-with-ai
[24] https://github.com/e2b-dev
[25] https://www.youtube.com/watch?v=MH3YbiMqusc
[26] https://docs.deno.com/api/deno/
[27] https://docs.deno.com/api/deno/~/Deno
[28] https://pipedream.com/apps/e2b
[29] https://docs.deno.com/runtime/reference/
[30] https://www.abdulazizahwan.com/2024/08/e2b-code-interpreting-for-ai-apps-a-comprehensive-guide.html
[31] https://docs.deno.com/examples/
[32] https://e2b.dev/docs/legacy/hello-world/py

---
Answer from Perplexity: pplx.ai/share