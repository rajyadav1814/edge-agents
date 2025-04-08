/**
 * Coverage example
 */

import { coverage } from "../coverage_calculator.ts";
import { TestRunner, runner } from "../test_runner.ts";
import { createTestRequest, mockFetch } from "../test_helpers.ts";
import { Fixtures } from "../test_fixtures.ts";

// Example function to test
async function handleChatCompletion(request: Request): Promise<Response> {
  const body = await request.json();
  
  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response("Invalid messages", { status: 400 });
  }

  if (body.messages.length === 0) {
    return new Response("Empty messages", { status: 400 });
  }

  const model = body.model || "gpt-3.5-turbo";
  const temperature = body.temperature ?? 0.7;
  const maxTokens = body.max_tokens ?? 1000;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model,
        messages: body.messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error("Chat completion error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// Test suite
async function runTests(): Promise<void> {
  // Initialize coverage
  await coverage.init([
    "./index.ts",
    "./providers.ts",
    "./stripe.ts",
  ]);

  // Start coverage collection
  coverage.startCollection();

  // Add tests
  runner.test("handles valid chat completion request", async () => {
    const request = createTestRequest(
      "POST",
      "/v1/chat/completions",
      Fixtures.requests.chat.valid,
      Fixtures.headers.valid
    );

    mockFetch([new Response(JSON.stringify(Fixtures.responses.success.chat))]);
    const response = await handleChatCompletion(request);
    
    if (!response.ok) {
      throw new Error(`Expected success, got ${response.status}`);
    }
  });

  runner.test("handles invalid messages", async () => {
    const request = createTestRequest(
      "POST",
      "/v1/chat/completions",
      { ...Fixtures.requests.chat.valid, messages: "invalid" },
      Fixtures.headers.valid
    );

    const response = await handleChatCompletion(request);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });

  runner.test("handles empty messages", async () => {
    const request = createTestRequest(
      "POST",
      "/v1/chat/completions",
      { ...Fixtures.requests.chat.valid, messages: [] },
      Fixtures.headers.valid
    );

    const response = await handleChatCompletion(request);
    
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });

  runner.test("handles API error", async () => {
    const request = createTestRequest(
      "POST",
      "/v1/chat/completions",
      Fixtures.requests.chat.valid,
      Fixtures.headers.valid
    );

    mockFetch([new Response("API Error", { status: 500 })]);
    const response = await handleChatCompletion(request);
    
    if (response.status !== 500) {
      throw new Error(`Expected 500, got ${response.status}`);
    }
  });

  // Run tests
  const results = await runner.run("Chat Completion Tests");
  
  // Print results using static method
  TestRunner.printResults(results);

  // Stop coverage collection
  await coverage.stopCollection();

  // Generate and save coverage report
  const report = coverage.generateReport();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const reportPath = `./coverage-report-${timestamp}.txt`;
  await Deno.writeTextFile(reportPath, report);

  // Verify coverage threshold
  const coverageData = coverage.calculateCoverage();
  if (coverageData.total < 80) {
    console.error(`Coverage (${coverageData.total.toFixed(2)}%) below threshold (80%)`);
    Deno.exit(1);
  }

  console.log("\nCoverage report saved to:", reportPath);
}

// Run example
if (import.meta.main) {
  await runTests();
}