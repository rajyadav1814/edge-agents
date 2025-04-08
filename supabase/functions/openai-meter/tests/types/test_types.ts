/**
 * Test type definitions
 */

// Test status types
export type TestStatus = "passed" | "failed" | "skipped" | "pending";

// Test performance metrics
export interface TestPerformance {
  latency: number;
  memory: number;
  cpuTime?: number;
  networkTime?: number;
  databaseTime?: number;
}

// Individual test result
export interface TestResult {
  name: string;
  status: TestStatus;
  duration: number;
  error?: Error | string;
  performance?: TestPerformance;
  metadata?: Record<string, unknown>;
}

// Test coverage metrics
export interface TestCoverage {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  total: number;
}

// Test suite summary
export interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage: number;
  startTime: number;
  endTime: number;
}

// Complete test suite
export interface TestSuite {
  name: string;
  summary: TestSummary;
  results: TestResult[];
  coverage?: TestCoverage;
  metadata?: Record<string, unknown>;
}

// Test configuration
export interface TestConfig {
  bail: boolean;
  timeout: number;
  parallel: boolean;
  retries: number;
  coverage: boolean;
  filter?: RegExp;
  tags?: string[];
}

// Test hook functions
export type TestHook = () => void | Promise<void>;

// Test function types
export type TestFn = () => void | Promise<void>;
export type TestCase = (t: TestContext) => void | Promise<void>;

// Test context for individual tests
export interface TestContext {
  name: string;
  skip: () => void;
  fail: (message?: string) => never;
  pass: () => void;
  timeout: (ms: number) => void;
  metadata: (data: Record<string, unknown>) => void;
  performance: {
    mark: (name: string) => void;
    measure: (name: string, start: string, end: string) => void;
    getEntries: () => PerformanceEntry[];
    clearMarks: () => void;
    clearMeasures: () => void;
  };
}

// Test runner events
export type TestEvent = 
  | { type: "start"; suite: string }
  | { type: "testStart"; name: string }
  | { type: "testEnd"; result: TestResult }
  | { type: "end"; summary: TestSummary };

// Test runner event handler
export type TestEventHandler = (event: TestEvent) => void;

// Test reporter interface
export interface TestReporter {
  onStart: (suite: string) => void;
  onTestStart: (name: string) => void;
  onTestEnd: (result: TestResult) => void;
  onEnd: (summary: TestSummary) => void;
}

// Test filter options
export interface TestFilter {
  names?: string[];
  tags?: string[];
  pattern?: RegExp;
  status?: TestStatus[];
}

// Test group configuration
export interface TestGroup {
  name: string;
  tests: TestCase[];
  before?: TestHook[];
  after?: TestHook[];
  beforeEach?: TestHook[];
  afterEach?: TestHook[];
  config?: Partial<TestConfig>;
}

// Test collection for organization
export interface TestCollection {
  name: string;
  groups: TestGroup[];
  config?: TestConfig;
  metadata?: Record<string, unknown>;
}

// Test assertion result
export interface AssertionResult {
  passed: boolean;
  message?: string;
  expected?: unknown;
  actual?: unknown;
  operator?: string;
  stack?: string;
}

// Custom matcher interface
export interface CustomMatcher {
  (received: unknown, ...args: unknown[]): AssertionResult;
  name: string;
  description?: string;
}

// Test snapshot
export interface TestSnapshot {
  name: string;
  content: string;
  updated: boolean;
  created: boolean;
}

// Test environment info
export interface TestEnvironment {
  deno: {
    version: string;
    arch: string;
    os: string;
  };
  typescript: {
    version: string;
    target: string;
  };
  env: Record<string, string>;
}