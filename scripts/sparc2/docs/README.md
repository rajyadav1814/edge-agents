# Publishing to NPM

To publish the SPARC2 package to npm under the @agentics.org organization, use the provided publish.sh script:

```bash
# Run with the NPM token as an argument
./publish.sh  (key)
```

The script will:
- Automatically change to the correct directory
- Set the NPM token from the provided argument
- Install required dependencies
- Build the package (skipping type checking)
- Publish to the npm registry under @agentics.org/sparc2

Alternatively, you can set the NPM_TOKEN environment variable before running the script:

```bash
export NPM_TOKEN=your_npm_token_here
./publish.sh
```

> **IMPORTANT**: Never hardcode actual npm tokens in documentation or source code. Always use environment variables or secure secret management systems.
