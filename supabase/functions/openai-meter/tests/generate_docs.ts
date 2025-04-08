/**
 * Documentation generator for OpenAI proxy test suite
 */

import { parse } from "https://deno.land/std@0.140.0/encoding/yaml.ts";
import { walk } from "https://deno.land/std@0.140.0/fs/walk.ts";
import { join } from "https://deno.land/std@0.140.0/path/mod.ts";

interface TestDoc {
  file: string;
  description?: string;
  tests: {
    name: string;
    description?: string;
    assertions: string[];
  }[];
}

interface Coverage {
  total: number;
  covered: number;
  percentage: number;
}

interface Documentation {
  overview: {
    testFiles: number;
    totalTests: number;
    coverage: Coverage;
  };
  components: {
    name: string;
    coverage: Coverage;
    tests: TestDoc[];
  }[];
}

/**
 * Extracts test documentation from test files
 */
async function extractTestDocs(path: string): Promise<TestDoc[]> {
  const docs: TestDoc[] = [];
  
  for await (const entry of walk(path, { 
    match: [/\.test\.ts$/],
    skip: [/node_modules/]
  })) {
    if (!entry.isFile) continue;

    const content = await Deno.readTextFile(entry.path);
    const doc: TestDoc = {
      file: entry.name,
      tests: []
    };

    // Extract file description from leading comment
    const fileComment = content.match(/\/\*\*([\s\S]*?)\*\//);
    if (fileComment) {
      doc.description = fileComment[1]
        .split("\n")
        .map(line => line.trim().replace(/^\*\s*/, ""))
        .join(" ")
        .trim();
    }

    // Extract test cases
    const testRegex = /Deno\.test\(['"](.*?)['"],\s*async.*?{([\s\S]*?)}\);/g;
    let match;
    while ((match = testRegex.exec(content)) !== null) {
      const testName = match[1];
      const testBody = match[2];

      const test = {
        name: testName,
        description: "",
        assertions: [] as string[]
      };

      // Extract test description from preceding comment
      const testComment = content
        .substring(0, match.index)
        .match(/\/\*\*([\s\S]*?)\*\//);
      if (testComment) {
        test.description = testComment[1]
          .split("\n")
          .map(line => line.trim().replace(/^\*\s*/, ""))
          .join(" ")
          .trim();
      }

      // Extract assertions
      const assertRegex = /assert\((.*?)\)|assertEquals\((.*?)\)|assertExists\((.*?)\)/g;
      let assertMatch;
      while ((assertMatch = assertRegex.exec(testBody)) !== null) {
        test.assertions.push(assertMatch[1] || assertMatch[2] || assertMatch[3]);
      }

      doc.tests.push(test);
    }

    docs.push(doc);
  }

  return docs;
}

/**
 * Generates coverage badges
 */
function generateCoverageBadge(coverage: number): string {
  const color = coverage >= 80 ? "green" : coverage >= 60 ? "yellow" : "red";
  return `![Coverage](https://img.shields.io/badge/coverage-${coverage}%25-${color})`;
}

/**
 * Generates markdown documentation
 */
function generateMarkdown(docs: Documentation): string {
  const timestamp = new Date().toISOString();
  const overallCoverage = docs.overview.coverage.percentage;

  return `# OpenAI Proxy Test Documentation
${generateCoverageBadge(overallCoverage)}

Generated on: ${timestamp}

## Overview
- Test Files: ${docs.overview.testFiles}
- Total Tests: ${docs.overview.totalTests}
- Coverage: ${overallCoverage}%

## Components
${docs.components.map(component => `
### ${component.name} ${generateCoverageBadge(component.coverage.percentage)}

${component.tests.map(testDoc => `
#### ${testDoc.file}
${testDoc.description ? `\n${testDoc.description}\n` : ""}

Tests:
${testDoc.tests.map(test => `
- **${test.name}**
  ${test.description ? `\n  Description: ${test.description}` : ""}
  \n  Assertions:
  ${test.assertions.map(assertion => `    - \`${assertion}\``).join("\n")}
`).join("\n")}
`).join("\n")}
`).join("\n")}

## Test Coverage Details
${docs.components.map(component => `
- ${component.name}: ${component.coverage.percentage}%
  - ${component.coverage.covered}/${component.coverage.total} lines covered
`).join("\n")}

## Running Tests
\`\`\`bash
deno test --allow-read --allow-env --coverage
\`\`\`

## Generating Coverage Report
\`\`\`bash
deno coverage coverage --lcov > coverage.lcov
\`\`\`
`;
}

/**
 * Main documentation generation function
 */
export async function generateDocs(testPath: string, outputPath: string): Promise<void> {
  // Extract test documentation
  const testDocs = await extractTestDocs(testPath);

  // Calculate coverage from lcov file if exists
  let coverage = { total: 0, covered: 0, percentage: 0 };
  try {
    const lcov = await Deno.readTextFile("coverage.lcov");
    const lines = lcov.split("\n");
    let totalLines = 0;
    let coveredLines = 0;
    
    for (const line of lines) {
      if (line.startsWith("LF:")) totalLines += parseInt(line.slice(3));
      if (line.startsWith("LH:")) coveredLines += parseInt(line.slice(3));
    }
    
    coverage = {
      total: totalLines,
      covered: coveredLines,
      percentage: Math.round((coveredLines / totalLines) * 100)
    };
  } catch {
    console.warn("No coverage data found");
  }

  // Generate documentation structure
  const docs: Documentation = {
    overview: {
      testFiles: testDocs.length,
      totalTests: testDocs.reduce((sum, doc) => sum + doc.tests.length, 0),
      coverage
    },
    components: [
      {
        name: "OpenAI Proxy",
        coverage,
        tests: testDocs
      }
    ]
  };

  // Generate and save markdown
  const markdown = generateMarkdown(docs);
  await Deno.writeTextFile(outputPath, markdown);
  console.log(`Documentation generated at ${outputPath}`);
}

// Run generator if executed directly
if (import.meta.main) {
  const testPath = "./";
  const outputPath = "TEST.md";
  await generateDocs(testPath, outputPath);
}