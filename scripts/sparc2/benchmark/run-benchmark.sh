#!/bin/bash

# SPARC2 HumanEval Benchmark Runner
# This script runs the HumanEval benchmark tests on the SPARC2 agent system
# and collects performance metrics for optimization.

# Set environment variables
export E2B_API_KEY=${E2B_API_KEY:-$(grep E2B_API_KEY ../.env | cut -d '=' -f2)}
export OPENAI_API_KEY=${OPENAI_API_KEY:-$(grep OPENAI_API_KEY ../.env | cut -d '=' -f2)}

# Configuration
BENCHMARK_TYPE="humaneval"
BENCHMARK_NAME="humaneval-sparc2"
DATA_PATH="../../sparc-bench/data/humaneval.jsonl"
RESULTS_DIR="./results"
ITERATIONS=3
MODEL="gpt-4o"
TEMPERATURE=0.2
MAX_TOKENS=4096

# Create results directory if it doesn't exist
mkdir -p $RESULTS_DIR

# Print banner
echo "=================================================="
echo "  SPARC2 HumanEval Benchmark Runner"
echo "=================================================="
echo "Benchmark Type: $BENCHMARK_TYPE"
echo "Data Path: $DATA_PATH"
echo "Model: $MODEL"
echo "Temperature: $TEMPERATURE"
echo "Iterations: $ITERATIONS"
echo "=================================================="

# Check if data file exists
if [ ! -f "$DATA_PATH" ]; then
    echo "Error: HumanEval dataset not found at $DATA_PATH"
    echo "Please ensure the dataset is downloaded and in the correct location."
    exit 1
fi

# Function to run a single benchmark iteration
run_benchmark() {
    local iteration=$1
    local output_file="$RESULTS_DIR/benchmark_${BENCHMARK_TYPE}_${iteration}.json"
    
    echo "Running benchmark iteration $iteration..."
    echo "Output will be saved to $output_file"
    
    # Run the benchmark using the SPARC2 CLI
    deno run --allow-read --allow-write --allow-env --allow-net /workspaces/edge-agents/scripts/sparc-bench/sparc-bench.ts run \
        -t $BENCHMARK_TYPE \
        -b $BENCHMARK_NAME \
        -o json \
        -f $output_file \
        --config /workspaces/edge-agents/scripts/sparc-bench/config.toml \
        --verbose
    
    echo "Iteration $iteration completed."
    return $?
}

# Function to analyze results
analyze_results() {
    echo "Analyzing benchmark results..."
    
    # Combine results from all iterations
    deno run --allow-read --allow-write --allow-env --allow-net /workspaces/edge-agents/scripts/sparc-bench/src/analysis/analyze-results.ts \
        --input "$RESULTS_DIR/benchmark_${BENCHMARK_TYPE}_*.json" \
        --output "$RESULTS_DIR/combined_results.json"
    
    # Generate summary report
    deno run --allow-read --allow-write --allow-env --allow-net /workspaces/edge-agents/scripts/sparc-bench/src/analysis/generate-report.ts \
        --input "$RESULTS_DIR/combined_results.json" \
        --output "$RESULTS_DIR/benchmark_report.md"
    
    echo "Analysis complete. Results saved to $RESULTS_DIR/benchmark_report.md"
}

# Main execution
echo "Starting benchmark with $ITERATIONS iterations..."

for i in $(seq 1 $ITERATIONS); do
    run_benchmark $i
    if [ $? -ne 0 ]; then
        echo "Error: Benchmark iteration $i failed."
        exit 1
    fi
    
    # Add a small delay between iterations
    if [ $i -lt $ITERATIONS ]; then
        echo "Waiting before next iteration..."
        sleep 5
    fi
done

# Analyze the results
analyze_results

echo "Benchmark completed successfully."
echo "=================================================="
echo "Results are available in the $RESULTS_DIR directory."
echo "=================================================="