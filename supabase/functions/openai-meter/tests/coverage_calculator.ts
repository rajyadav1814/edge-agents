/**
 * Test coverage calculator
 */

import { type TestCoverage } from "./types/test_types.ts";

interface CoverageData {
  path: string;
  lines: Set<number>;
  branches: Set<string>;
  functions: Set<string>;
  statements: Set<number>;
}

interface SourceMap {
  path: string;
  content: string;
  lines: number[];
  branches: { id: string; line: number }[];
  functions: { name: string; lines: number[] }[];
}

interface CoverageEvent {
  type: "line" | "branch" | "function";
  path: string;
  line?: number;
  branchId?: string;
  functionName?: string;
}

/**
 * Coverage calculator class
 */
export class CoverageCalculator {
  private coverage: Map<string, CoverageData> = new Map();
  private sourceMaps: Map<string, SourceMap> = new Map();
  private isCollecting = false;
  private collectionInterval: number | null = null;

  /**
   * Initialize coverage tracking
   */
  async init(paths: string | string[]): Promise<void> {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    for (const path of pathArray) {
      try {
        const content = await Deno.readTextFile(path);
        const sourceMap = await this.generateSourceMap(path, content);
        this.sourceMaps.set(path, sourceMap);
        this.coverage.set(path, {
          path,
          lines: new Set(),
          branches: new Set(),
          functions: new Set(),
          statements: new Set(),
        });
      } catch (error) {
        console.warn(`Failed to initialize coverage for ${path}:`, error);
      }
    }
  }

  /**
   * Start coverage collection
   */
  startCollection(): void {
    if (this.isCollecting) return;
    this.isCollecting = true;

    // Use polling for coverage collection
    this.collectionInterval = setInterval(async () => {
      try {
        // Get stack trace to analyze execution
        const stack = new Error().stack;
        if (!stack) return;

        // Parse stack trace for coverage information
        const lines = stack.split("\n");
        for (const line of lines) {
          const match = line.match(/at\s+(\S+)\s+\((.+):(\d+):\d+\)/);
          if (match) {
            const [, fnName, path, lineNum] = match;
            const event: CoverageEvent = {
              type: "line",
              path,
              line: parseInt(lineNum, 10),
            };

            if (fnName && fnName !== "Object.<anonymous>") {
              event.type = "function";
              event.functionName = fnName;
            }

            this.handleCoverageEvent(event);
          }
        }
      } catch (error) {
        console.warn("Coverage collection error:", error);
      }
    }, 100); // Poll every 100ms
  }

  /**
   * Stop coverage collection
   */
  async stopCollection(): Promise<void> {
    if (!this.isCollecting) return;
    this.isCollecting = false;

    if (this.collectionInterval !== null) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  /**
   * Handle coverage event
   */
  private handleCoverageEvent(event: CoverageEvent): void {
    switch (event.type) {
      case "line":
        if (event.line !== undefined) {
          this.recordLine(event.path, event.line);
        }
        break;
      case "branch":
        if (event.branchId) {
          this.recordBranch(event.path, event.branchId);
        }
        break;
      case "function":
        if (event.functionName) {
          this.recordFunction(event.path, event.functionName);
        }
        break;
    }
  }

  /**
   * Generate source map
   */
  private async generateSourceMap(path: string, content: string): Promise<SourceMap> {
    const lines = content.split("\n").map((_, i) => i + 1);
    const branches: { id: string; line: number }[] = [];
    const functions: { name: string; lines: number[] }[] = [];

    // Simple function detection
    const functionRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function|\(\s*\)\s*(?:=>|{))/g;
    let match;
    let lineNumber = 1;

    for (const line of content.split("\n")) {
      while ((match = functionRegex.exec(line)) !== null) {
        const name = match[1] || match[2] || `anonymous_${lineNumber}`;
        functions.push({ name, lines: [lineNumber] });
      }

      // Simple branch detection (if/else/switch)
      if (/(if|else|switch|case|default)\b/.test(line)) {
        branches.push({
          id: `branch_${lineNumber}`,
          line: lineNumber,
        });
      }

      lineNumber++;
    }

    return {
      path,
      content,
      lines,
      branches,
      functions,
    };
  }

  /**
   * Record line coverage
   */
  recordLine(path: string, line: number): void {
    const data = this.coverage.get(path);
    if (data) {
      data.lines.add(line);
      data.statements.add(line);
    }
  }

  /**
   * Record branch coverage
   */
  recordBranch(path: string, branchId: string): void {
    const data = this.coverage.get(path);
    if (data) {
      data.branches.add(branchId);
    }
  }

  /**
   * Record function coverage
   */
  recordFunction(path: string, name: string): void {
    const data = this.coverage.get(path);
    if (data) {
      data.functions.add(name);
    }
  }

  /**
   * Calculate coverage for a file
   */
  private calculateFileCoverage(path: string): TestCoverage {
    const data = this.coverage.get(path);
    const sourceMap = this.sourceMaps.get(path);

    if (!data || !sourceMap) {
      return {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
        total: 0,
      };
    }

    const lineCoverage = (data.lines.size / sourceMap.lines.length) * 100;
    const branchCoverage = sourceMap.branches.length > 0
      ? (data.branches.size / sourceMap.branches.length) * 100
      : 100;
    const functionCoverage = sourceMap.functions.length > 0
      ? (data.functions.size / sourceMap.functions.length) * 100
      : 100;
    const statementCoverage = (data.statements.size / sourceMap.lines.length) * 100;

    return {
      statements: statementCoverage,
      branches: branchCoverage,
      functions: functionCoverage,
      lines: lineCoverage,
      total: (statementCoverage + branchCoverage + functionCoverage + lineCoverage) / 4,
    };
  }

  /**
   * Calculate total coverage
   */
  calculateCoverage(): TestCoverage {
    const coverages = Array.from(this.coverage.keys())
      .map(path => this.calculateFileCoverage(path));

    if (coverages.length === 0) {
      return {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
        total: 0,
      };
    }

    return {
      statements: this.average(coverages.map(c => c.statements)),
      branches: this.average(coverages.map(c => c.branches)),
      functions: this.average(coverages.map(c => c.functions)),
      lines: this.average(coverages.map(c => c.lines)),
      total: this.average(coverages.map(c => c.total)),
    };
  }

  /**
   * Calculate average
   */
  private average(numbers: number[]): number {
    return numbers.reduce((a, b) => a + b, 0) / numbers.length;
  }

  /**
   * Generate coverage report
   */
  generateReport(): string {
    let report = "Coverage Report\n";
    report += "===============\n\n";

    for (const path of this.coverage.keys()) {
      const coverage = this.calculateFileCoverage(path);
      report += `File: ${path}\n`;
      report += `-`.repeat(path.length + 6) + "\n";
      report += `Statements: ${coverage.statements.toFixed(2)}%\n`;
      report += `Branches: ${coverage.branches.toFixed(2)}%\n`;
      report += `Functions: ${coverage.functions.toFixed(2)}%\n`;
      report += `Lines: ${coverage.lines.toFixed(2)}%\n`;
      report += `Total: ${coverage.total.toFixed(2)}%\n\n`;
    }

    const totalCoverage = this.calculateCoverage();
    report += "Total Coverage\n";
    report += "-------------\n";
    report += `Statements: ${totalCoverage.statements.toFixed(2)}%\n`;
    report += `Branches: ${totalCoverage.branches.toFixed(2)}%\n`;
    report += `Functions: ${totalCoverage.functions.toFixed(2)}%\n`;
    report += `Lines: ${totalCoverage.lines.toFixed(2)}%\n`;
    report += `Total: ${totalCoverage.total.toFixed(2)}%\n`;

    return report;
  }

  /**
   * Clear coverage data
   */
  clear(): void {
    this.coverage.clear();
    this.sourceMaps.clear();
    this.isCollecting = false;
    if (this.collectionInterval !== null) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }
}

// Export singleton instance
export const coverage = new CoverageCalculator();