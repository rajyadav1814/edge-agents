#!/bin/bash
# Run rate limiting detection and adjustment tests

echo "Running rate limiting detection and adjustment tests..."
deno test --allow-net --allow-env scripts/gemini-tumbler/tests/rate-limiting-basic-test.ts