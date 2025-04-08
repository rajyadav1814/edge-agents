import { TestConfig } from "./test.config.ts";

/**
 * Test runner configuration
 */
interface TestRunnerConfig {
  files: string[];
  coverage: {
    enabled: boolean;
    reportDir: string;
    formats: string[];
    threshold: number;
  };
  permissions: {
    read: boolean;
    write: boolean;
    env: boolean;
    net: boolean;
  };
}

const config: TestRunnerConfig = {
  files: [
    "./index.test.ts",
    "./providers.test.ts",
    "./stripe.test.ts",
    "./cors.test.ts",
    "./performance.test.ts",
    "./errors.test.ts",
    "./integration.test.ts",
  ],
  coverage: {
    enabled: true,
    reportDir: TestConfig.coverage.reportDir,
    formats: TestConfig.coverage.reportFormats,
    threshold: TestConfig.coverage.threshold,
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
    // Create coverage directory
    try {
      await Deno.mkdir(config.coverage.reportDir, { recursive: true });
    } catch {
      // Directory might already exist
    }

    // Run tests with coverage
    const testArgs = [
      "test",
      "--allow-read=" + (config.permissions.read ? "true" : "false"),
      "--allow-write=" + (config.permissions.write ? "true" : "false"),
      "--allow-env=" + (config.permissions.env ? "true" : "false"),
      "--allow-net=" + (config.permissions.net ? "true" : "false"),
      "--coverage=" + config.coverage.reportDir,
      ...config.files,
    ];

    const testCommand = new Deno.Command("deno", {
      args: testArgs,
    });

    const testResult = await testCommand.output();
    
    if (testResult.code !== 0) {
      console.error("Tests failed:");
      console.error(new TextDecoder().decode(testResult.stderr));
      Deno.exit(1);
    }

    console.log(new TextDecoder().decode(testResult.stdout));

    // Generate coverage reports
    for (const format of config.coverage.formats) {
      const args = ["coverage", config.coverage.reportDir];
      
      switch (format) {
        case "lcov":
          args.push("--lcov", "--output=" + config.coverage.reportDir + "/lcov.info");
          break;
        case "html":
          args.push("--html", "--output=" + config.coverage.reportDir + "/html");
          break;
        case "text":
          args.push("--text");
          break;
      }

      const coverageCommand = new Deno.Command("deno", { args });
      await coverageCommand.output();
    }

    // Check coverage threshold
    const coverageCommand = new Deno.Command("deno", {
      args: ["coverage", config.coverage.reportDir],
    });

    const { stdout: coverageOutput } = await coverageCommand.output();
    const coverageText = new TextDecoder().decode(coverageOutput);

    // Parse coverage percentage
    const lines = coverageText.split("\n");
    let totalCoverage = 0;
    let coveredLines = 0;
    let totalLines = 0;

    for (const line of lines) {
      if (line.includes("|")) {
        // Skip excluded paths
        if (TestConfig.coverage.excludePaths.some(path => line.includes(path))) {
          continue;
        }

        const match = line.match(/\|\s*(\d+)\/(\d+)/);
        if (match) {
          coveredLines += parseInt(match[1]);
          totalLines += parseInt(match[2]);
        }
      }
    }

    totalCoverage = (coveredLines / totalLines) * 100;

    if (totalCoverage < config.coverage.threshold) {
      console.error(`\nCoverage (${totalCoverage.toFixed(2)}%) below threshold (${config.coverage.threshold}%)`);
      Deno.exit(1);
    }

    // Print summary
    const duration = Date.now() - startTime;
    console.log("\nTest Summary:");
    console.log("-------------");
    console.log(`Total Files: ${config.files.length}`);
    console.log(`Coverage: ${totalCoverage.toFixed(2)}%`);
    console.log(`Duration: ${duration}ms`);
    console.log("\nCoverage reports generated:");
    console.log(`- LCOV: ${config.coverage.reportDir}/lcov.info`);
    console.log(`- HTML: ${config.coverage.reportDir}/html/index.html`);

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