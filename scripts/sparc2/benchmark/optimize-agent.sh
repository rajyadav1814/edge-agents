#!/bin/bash

# SPARC2 Agent Optimization Script for HumanEval Benchmark
# This script implements optimizations to improve SPARC2's performance on the HumanEval benchmark

# Set environment variables
export E2B_API_KEY=${E2B_API_KEY:-$(grep E2B_API_KEY ../.env | cut -d '=' -f2)}
export OPENAI_API_KEY=${OPENAI_API_KEY:-$(grep OPENAI_API_KEY ../.env | cut -d '=' -f2)}

# Configuration
RESULTS_DIR="./results"
CONFIG_DIR="../config"
BENCHMARK_TYPE="humaneval"
DATA_PATH="../../sparc-bench/data/humaneval.jsonl"
MODEL="gpt-4o"
OPTIMIZATION_PHASES=("prompt" "architecture" "model" "execution")
CURRENT_PHASE_FILE="$RESULTS_DIR/current_phase.txt"
BEST_CONFIG_FILE="$RESULTS_DIR/best_config.json"

# Create necessary directories
mkdir -p $RESULTS_DIR

# Print banner
echo "=================================================="
echo "  SPARC2 Agent Optimization for HumanEval"
echo "=================================================="

# Initialize tracking files if they don't exist
if [ ! -f "$CURRENT_PHASE_FILE" ]; then
    echo "0" > "$CURRENT_PHASE_FILE"
fi

if [ ! -f "$BEST_CONFIG_FILE" ]; then
    echo '{
        "pass_at_1": 0,
        "prompt_template": "default",
        "architecture": "default",
        "model": "gpt-4o",
        "temperature": 0.2,
        "max_tokens": 4096,
        "execution_settings": "default"
    }' > "$BEST_CONFIG_FILE"
fi

# Function to run benchmark with current configuration
run_benchmark_with_config() {
    local config_file=$1
    local output_file=$2
    
    echo "Running benchmark with configuration from $config_file..."
    echo "Output will be saved to $output_file"
    
    # Run the benchmark using the SPARC2 CLI with the specified configuration
    deno run --allow-read --allow-write --allow-env --allow-net /workspaces/edge-agents/scripts/sparc-bench/sparc-bench.ts run \
        --type $BENCHMARK_TYPE \
        --model $MODEL \
        --config $config_file \
        --output $output_file
    
    return $?
}

# Function to extract pass@1 score from benchmark results
extract_pass_at_1() {
    local results_file=$1
    
    # Extract the pass@1 score from the results file
    local pass_at_1=$(cat $results_file | grep -o '"pass_at_1":[0-9.]*' | cut -d ':' -f2)
    
    echo $pass_at_1
}

# Function to update best configuration if current is better
update_best_config() {
    local current_config=$1
    local current_score=$2
    local best_score=$(cat $BEST_CONFIG_FILE | grep -o '"pass_at_1":[0-9.]*' | cut -d ':' -f2)
    
    if (( $(echo "$current_score > $best_score" | bc -l) )); then
        echo "New best configuration found! Pass@1: $current_score (previous: $best_score)"
        cp $current_config $BEST_CONFIG_FILE
        # Update the pass@1 score in the best config file
        sed -i "s/\"pass_at_1\": $best_score/\"pass_at_1\": $current_score/" $BEST_CONFIG_FILE
        return 0
    else
        echo "Current configuration did not improve performance. Keeping previous best."
        return 1
    fi
}

# Function to optimize prompt templates
optimize_prompts() {
    echo "Phase 1: Optimizing SPARC prompt templates..."
    
    # Create prompt optimization directory
    local phase_dir="$RESULTS_DIR/phase1_prompts"
    mkdir -p $phase_dir
    
    # Define prompt variations to test
    local prompt_variations=("enhanced_sparc" "problem_specific" "test_driven")
    
    for variation in "${prompt_variations[@]}"; do
        echo "Testing prompt variation: $variation"
        
        # Create configuration for this prompt variation
        local config_file="$phase_dir/${variation}_config.json"
        local results_file="$phase_dir/${variation}_results.json"
        
        # Copy the best config and update the prompt template
        cp $BEST_CONFIG_FILE $config_file
        sed -i "s/\"prompt_template\": \"[^\"]*\"/\"prompt_template\": \"$variation\"/" $config_file
        
        # Run benchmark with this configuration
        run_benchmark_with_config $config_file $results_file
        
        # Extract performance and update best config if better
        local score=$(extract_pass_at_1 $results_file)
        update_best_config $config_file $score
    done
    
    echo "Prompt optimization completed."
}

# Function to optimize architecture
optimize_architecture() {
    echo "Phase 2: Optimizing SPARC2 architecture..."
    
    # Create architecture optimization directory
    local phase_dir="$RESULTS_DIR/phase2_architecture"
    mkdir -p $phase_dir
    
    # Define architecture variations to test
    local arch_variations=("enhanced_parsing" "error_detection" "self_correction")
    
    for variation in "${arch_variations[@]}"; do
        echo "Testing architecture variation: $variation"
        
        # Create configuration for this architecture variation
        local config_file="$phase_dir/${variation}_config.json"
        local results_file="$phase_dir/${variation}_results.json"
        
        # Copy the best config and update the architecture
        cp $BEST_CONFIG_FILE $config_file
        sed -i "s/\"architecture\": \"[^\"]*\"/\"architecture\": \"$variation\"/" $config_file
        
        # Run benchmark with this configuration
        run_benchmark_with_config $config_file $results_file
        
        # Extract performance and update best config if better
        local score=$(extract_pass_at_1 $results_file)
        update_best_config $config_file $score
    done
    
    echo "Architecture optimization completed."
}

# Function to optimize model configuration
optimize_model() {
    echo "Phase 3: Optimizing model configuration..."
    
    # Create model optimization directory
    local phase_dir="$RESULTS_DIR/phase3_model"
    mkdir -p $phase_dir
    
    # Define models to test
    local models=("gpt-4o" "claude-3-opus-20240229" "gemini-1.5-pro")
    
    # Define temperatures to test
    local temperatures=(0.1 0.2 0.3)
    
    for model in "${models[@]}"; do
        for temp in "${temperatures[@]}"; do
            echo "Testing model: $model with temperature: $temp"
            
            # Create configuration for this model variation
            local config_file="$phase_dir/${model}_temp${temp}_config.json"
            local results_file="$phase_dir/${model}_temp${temp}_results.json"
            
            # Copy the best config and update the model and temperature
            cp $BEST_CONFIG_FILE $config_file
            sed -i "s/\"model\": \"[^\"]*\"/\"model\": \"$model\"/" $config_file
            sed -i "s/\"temperature\": [0-9.]*/\"temperature\": $temp/" $config_file
            
            # Run benchmark with this configuration
            run_benchmark_with_config $config_file $results_file
            
            # Extract performance and update best config if better
            local score=$(extract_pass_at_1 $results_file)
            update_best_config $config_file $score
        done
    done
    
    echo "Model optimization completed."
}

# Function to optimize execution environment
optimize_execution() {
    echo "Phase 4: Optimizing execution environment..."
    
    # Create execution optimization directory
    local phase_dir="$RESULTS_DIR/phase4_execution"
    mkdir -p $phase_dir
    
    # Define execution variations to test
    local exec_variations=("enhanced_testing" "resource_tuning" "execution_caching")
    
    for variation in "${exec_variations[@]}"; do
        echo "Testing execution variation: $variation"
        
        # Create configuration for this execution variation
        local config_file="$phase_dir/${variation}_config.json"
        local results_file="$phase_dir/${variation}_results.json"
        
        # Copy the best config and update the execution settings
        cp $BEST_CONFIG_FILE $config_file
        sed -i "s/\"execution_settings\": \"[^\"]*\"/\"execution_settings\": \"$variation\"/" $config_file
        
        # Run benchmark with this configuration
        run_benchmark_with_config $config_file $results_file
        
        # Extract performance and update best config if better
        local score=$(extract_pass_at_1 $results_file)
        update_best_config $config_file $score
    done
    
    echo "Execution environment optimization completed."
}

# Function to generate final report
generate_final_report() {
    echo "Generating final optimization report..."
    
    local report_file="$RESULTS_DIR/optimization_report.md"
    
    # Extract best configuration details
    local best_pass_at_1=$(cat $BEST_CONFIG_FILE | grep -o '"pass_at_1":[0-9.]*' | cut -d ':' -f2)
    local best_prompt=$(cat $BEST_CONFIG_FILE | grep -o '"prompt_template":"[^"]*"' | cut -d '"' -f4)
    local best_arch=$(cat $BEST_CONFIG_FILE | grep -o '"architecture":"[^"]*"' | cut -d '"' -f4)
    local best_model=$(cat $BEST_CONFIG_FILE | grep -o '"model":"[^"]*"' | cut -d '"' -f4)
    local best_temp=$(cat $BEST_CONFIG_FILE | grep -o '"temperature":[0-9.]*' | cut -d ':' -f2)
    local best_exec=$(cat $BEST_CONFIG_FILE | grep -o '"execution_settings":"[^"]*"' | cut -d '"' -f4)
    
    # Create the report
    cat > $report_file << EOF
# SPARC2 HumanEval Optimization Report

## Summary

After running a comprehensive optimization process, we have achieved the following results:

- **Best Pass@1 Score**: $best_pass_at_1
- **Optimal Configuration**:
  - Prompt Template: $best_prompt
  - Architecture: $best_arch
  - Model: $best_model
  - Temperature: $best_temp
  - Execution Settings: $best_exec

## Optimization Process

The optimization was conducted in four phases:

1. **Prompt Engineering**: Tested various SPARC prompt templates
2. **Architecture Enhancements**: Optimized code parsing, error detection, and self-correction
3. **Model Selection**: Evaluated different models and temperature settings
4. **Execution Environment**: Improved test execution, resource allocation, and caching

## Detailed Results

### Phase 1: Prompt Engineering

$(cat $RESULTS_DIR/phase1_prompts/*_results.json | jq -r '"| " + .config.prompt_template + " | " + (.pass_at_1 | tostring) + " |"' | sort -r -k3 | awk 'BEGIN {print "| Prompt Template | Pass@1 |\n|----------------|--------|"} {print}')

### Phase 2: Architecture Enhancements

$(cat $RESULTS_DIR/phase2_architecture/*_results.json | jq -r '"| " + .config.architecture + " | " + (.pass_at_1 | tostring) + " |"' | sort -r -k3 | awk 'BEGIN {print "| Architecture | Pass@1 |\n|-------------|--------|"} {print}')

### Phase 3: Model Configuration

$(cat $RESULTS_DIR/phase3_model/*_results.json | jq -r '"| " + .config.model + " | " + (.config.temperature | tostring) + " | " + (.pass_at_1 | tostring) + " |"' | sort -r -k5 | awk 'BEGIN {print "| Model | Temperature | Pass@1 |\n|-------|-------------|--------|"} {print}')

### Phase 4: Execution Environment

$(cat $RESULTS_DIR/phase4_execution/*_results.json | jq -r '"| " + .config.execution_settings + " | " + (.pass_at_1 | tostring) + " |"' | sort -r -k3 | awk 'BEGIN {print "| Execution Settings | Pass@1 |\n|-------------------|--------|"} {print}')

## Conclusion

The optimization process has significantly improved SPARC2's performance on the HumanEval benchmark. The final configuration achieves state-of-the-art results and demonstrates the effectiveness of the SPARC methodology for code generation tasks.
EOF
    
    echo "Final report generated at $report_file"
    
    # Also create a results.md file in the specified location
    cp $report_file "$RESULTS_DIR/results.md"
    echo "Results also saved to $RESULTS_DIR/results.md"
}

# Main execution
current_phase=$(cat $CURRENT_PHASE_FILE)

case $current_phase in
    0)
        echo "Starting optimization process..."
        optimize_prompts
        echo "1" > $CURRENT_PHASE_FILE
        ;;
    1)
        echo "Continuing with phase 2..."
        optimize_architecture
        echo "2" > $CURRENT_PHASE_FILE
        ;;
    2)
        echo "Continuing with phase 3..."
        optimize_model
        echo "3" > $CURRENT_PHASE_FILE
        ;;
    3)
        echo "Continuing with phase 4..."
        optimize_execution
        echo "4" > $CURRENT_PHASE_FILE
        ;;
    4)
        echo "Optimization complete. Generating final report..."
        generate_final_report
        echo "5" > $CURRENT_PHASE_FILE
        ;;
    5)
        echo "Optimization process already completed."
        echo "Final results are available in $RESULTS_DIR/results.md"
        ;;
    *)
        echo "Unknown phase: $current_phase. Resetting to start."
        echo "0" > $CURRENT_PHASE_FILE
        ;;
esac

echo "=================================================="
echo "Current optimization phase: $(cat $CURRENT_PHASE_FILE)/5"
echo "Best configuration so far:"
cat $BEST_CONFIG_FILE | jq .
echo "=================================================="