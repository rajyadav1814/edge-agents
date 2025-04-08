import { TestConfig } from "./test.config.ts";

/**
 * Test runner configuration
 */
const config = {
  files: [
    "./index.test.ts",
    "./providers.test.ts",
    "./stripe.test.ts",
    "./cors.test.ts",
    "./performance.test.ts",
  ],
  coverage: {
    ...TestConfig.coverage,
    include: [
      "index.ts",
      "providers.ts",
      "stripe.ts",
      "types.ts",
    ],
  },
  permissions: {
    read: true,
    write: true,
    env: true,
    net: true,
  },
};

/**
 * Run tests with coverage
 */
async function runTests() {
  console.log("Starting test suite...\n");
  const startTime = Date.now();

  try {
    // Run tests with coverage
    const command = new Deno.Command("deno", {
      args: [
        "test",
        "--coverage=coverage",
        "--allow-read",
        "--allow-write",
        "--allow-env",
        "--allow-net",
        ...config.files,
      ],
    });

    const { code, stdout, stderr } = await command.output();
    
    if (code !== 0) {
      console.error("Tests failed:");
      console.error(new TextDecoder().decode(stderr));
      Deno.exit(1);
    }

    console.log(new TextDecoder().decode(stdout));

    // Generate coverage report
    const lcovCommand = new Deno.Command("deno", {
      args: [
        "coverage",
        "./coverage",
        "--lcov",
        "--output=coverage/lcov.info",
      ],
    });

    await lcovCommand.output();

    // Generate HTML report
    const htmlCommand = new Deno.Command("deno", {
      args: [
        "coverage",
        "./coverage",
        "--html",
        "--output=coverage/html",
      ],
    });

    await htmlCommand.output();

    // Check coverage threshold
    const coverageCommand = new Deno.Command("deno", {
      args: [
        "coverage",
        "./coverage",
      ],
    });

    const { stdout: coverageOutput } = await coverageCommand.output();
    const coverageText = new TextDecoder().decode(coverageOutput);
    const coverageMatch = coverageText.match(/coverage: (\d+(\.\d+)?)%/);
    
    if (!coverageMatch) {
      throw new Error("Could not parse coverage percentage");
    }

    const coveragePercentage = parseFloat(coverageMatch[1]);
    if (coveragePercentage < TestConfig.coverage.threshold) {
      console.error(`\nCoverage (${coveragePercentage}%) below threshold (${TestConfig.coverage.threshold}%)`);
      Deno.exit(1);
    }

    // Print summary
    const duration = Date.now() - startTime;
    console.log("\nTest Summary:");
    console.log("-------------");
    console.log(`Total Files: ${config.files.length}`);
    console.log(`Coverage: ${coveragePercentage}%`);
    console.log(`Duration: ${duration}ms`);
    console.log("\nCoverage reports generated:");
    console.log("- LCOV: coverage/lcov.info");
    console.log("- HTML: coverage/html/index.html");

  } catch (error) {
    console.error("\nError running tests:", error);
    Deno.exit(1);
  }
}

// Run tests if this is the main module
if (import.meta.main) {
  await runTests();
}

export { runTests };