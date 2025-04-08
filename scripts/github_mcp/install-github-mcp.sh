#!/bin/bash

#########################################################
# GitHub MCP Server All-in-One Installation Script
# 
# This script automates the complete setup process for the GitHub MCP server:
# - Checks for prerequisites (Docker, Node.js, Git)
# - Clones the repository if needed
# - Sets up environment variables securely
# - Builds and runs the server using Docker or Docker Compose
# - Configures VS Code integration
# - Runs tests to verify the installation
#
# Usage: ./install-github-mcp.sh [options]
#
# Options:
#   --help                  Show this help message
#   --install-mode=MODE     Installation mode: docker, docker-compose, local (default: docker)
#   --port=PORT             Port to run the server on (default: 3000)
#   --host=HOST             Host to bind the server to (default: 0.0.0.0)
#   --github-token=TOKEN    GitHub Personal Access Token
#   --api-token=TOKEN       API Token for server authentication
#   --enable-tls            Enable TLS/HTTPS
#   --tls-cert=PATH         Path to TLS certificate file
#   --tls-key=PATH          Path to TLS key file
#   --log-level=LEVEL       Log level: debug, info, warn, error (default: info)
#   --log-format=FORMAT     Log format: text, json (default: text)
#   --skip-clone            Skip repository cloning
#   --skip-tests            Skip running tests
#   --skip-vscode           Skip VS Code integration
#   --repo-path=PATH        Path to existing repository (if --skip-clone is used)
#   --test-repo=REPO        Test repository in format owner/repo
#   --verbose               Enable verbose output
#
# Author: Roo AI Assistant
# Date: April 5, 2025
#########################################################

set -e

# Default values
INSTALL_MODE="docker"
MCP_PORT=3000
MCP_HOST="0.0.0.0"
GITHUB_TOKEN=""
API_TOKEN=""
ENABLE_TLS=false
TLS_CERT_PATH=""
TLS_KEY_PATH=""
LOG_LEVEL="info"
LOG_FORMAT="text"
SKIP_CLONE=false
SKIP_TESTS=false
SKIP_VSCODE=false
REPO_PATH=""
TEST_REPO=""
VERBOSE=false
REPO_URL="https://github.com/your-org/github-mcp-server.git"  # Replace with actual repo URL
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="$SCRIPT_DIR/github-mcp-server"
ENV_FILE="$INSTALL_DIR/.env"
VSCODE_DIR="$INSTALL_DIR/.vscode"
VSCODE_MCP_JSON="$VSCODE_DIR/mcp.json"
VSCODE_SETTINGS_JSON="$VSCODE_DIR/settings.json"
ENV_MCP_FILE="$INSTALL_DIR/.env.mcp"
LOG_DIR="$INSTALL_DIR/logs"
CERTS_DIR="$INSTALL_DIR/certs"
TERMINAL_OUTPUT=""

# Function to log messages
log() {
    local level=$1
    local message=$2
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case $level in
        "INFO")
            echo -e "\033[0;32m[INFO]\033[0m $timestamp - $message"
            ;;
        "WARN")
            echo -e "\033[0;33m[WARN]\033[0m $timestamp - $message"
            ;;
        "ERROR")
            echo -e "\033[0;31m[ERROR]\033[0m $timestamp - $message"
            ;;
        "DEBUG")
            if [ "$VERBOSE" = true ]; then
                echo -e "\033[0;34m[DEBUG]\033[0m $timestamp - $message"
            fi
            ;;
        *)
            echo -e "$timestamp - $message"
            ;;
    esac
    
    # Append to terminal output log
    TERMINAL_OUTPUT="$TERMINAL_OUTPUT\n[$level] $timestamp - $message"
}

# Function to execute commands with logging
execute() {
    local command=$1
    local description=$2
    
    log "DEBUG" "Executing: $command"
    log "INFO" "$description"
    
    if [ "$VERBOSE" = true ]; then
        eval "$command"
    else
        eval "$command" > /dev/null 2>&1 || {
            log "ERROR" "Command failed: $command"
            exit 1
        }
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to generate a random token
generate_random_token() {
    if command_exists openssl; then
        openssl rand -hex 32
    else
        # Fallback if openssl is not available
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check for Git
    if ! command_exists git; then
        log "ERROR" "Git is not installed. Please install Git and try again."
        exit 1
    else
        log "DEBUG" "Git is installed: $(git --version)"
    fi
    
    # Check for Node.js
    if ! command_exists node; then
        log "ERROR" "Node.js is not installed. Please install Node.js (v14+) and try again."
        exit 1
    else
        log "DEBUG" "Node.js is installed: $(node --version)"
    fi
    
    # Check for npm
    if ! command_exists npm; then
        log "ERROR" "npm is not installed. Please install npm and try again."
        exit 1
    else
        log "DEBUG" "npm is installed: $(npm --version)"
    fi
    
    # Check for Docker if using Docker installation mode
    if [ "$INSTALL_MODE" = "docker" ] || [ "$INSTALL_MODE" = "docker-compose" ]; then
        if ! command_exists docker; then
            log "ERROR" "Docker is not installed. Please install Docker and try again."
            exit 1
        else
            log "DEBUG" "Docker is installed: $(docker --version)"
        fi
        
        # Check Docker daemon is running
        if ! docker info &> /dev/null; then
            log "ERROR" "Docker daemon is not running. Please start Docker and try again."
            exit 1
        fi
    fi
    
    # Check for Docker Compose if using docker-compose installation mode
    if [ "$INSTALL_MODE" = "docker-compose" ]; then
        if command_exists docker-compose; then
            log "DEBUG" "Docker Compose V1 is installed: $(docker-compose --version)"
            DOCKER_COMPOSE="docker-compose"
        elif docker compose version &> /dev/null; then
            log "DEBUG" "Docker Compose V2 is installed: $(docker compose version)"
            DOCKER_COMPOSE="docker compose"
        else
            log "ERROR" "Docker Compose is not installed. Please install Docker Compose and try again."
            exit 1
        fi
    fi
    
    # Check for Go if using local installation mode
    if [ "$INSTALL_MODE" = "local" ]; then
        if ! command_exists go; then
            log "ERROR" "Go is not installed. Please install Go (v1.19+) and try again."
            exit 1
        else
            log "DEBUG" "Go is installed: $(go version)"
        fi
    fi
    
    log "INFO" "All prerequisites are met."
}

# Function to clone the repository
clone_repository() {
    if [ "$SKIP_CLONE" = true ]; then
        if [ -z "$REPO_PATH" ]; then
            log "ERROR" "Repository path must be specified when using --skip-clone."
            exit 1
        fi
        
        if [ ! -d "$REPO_PATH" ]; then
            log "ERROR" "Specified repository path does not exist: $REPO_PATH"
            exit 1
        fi
        
        INSTALL_DIR="$REPO_PATH"
        ENV_FILE="$INSTALL_DIR/.env"
        VSCODE_DIR="$INSTALL_DIR/.vscode"
        VSCODE_MCP_JSON="$VSCODE_DIR/mcp.json"
        VSCODE_SETTINGS_JSON="$VSCODE_DIR/settings.json"
        ENV_MCP_FILE="$INSTALL_DIR/.env.mcp"
        LOG_DIR="$INSTALL_DIR/logs"
        CERTS_DIR="$INSTALL_DIR/certs"
        
        log "INFO" "Using existing repository at: $INSTALL_DIR"
    else
        log "INFO" "Cloning GitHub MCP server repository..."
        
        if [ -d "$INSTALL_DIR" ]; then
            log "WARN" "Directory already exists: $INSTALL_DIR"
            read -p "Do you want to overwrite it? (y/N): " overwrite
            if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
                log "INFO" "Using existing directory."
            else
                log "INFO" "Removing existing directory..."
                rm -rf "$INSTALL_DIR"
                execute "git clone $REPO_URL $INSTALL_DIR" "Cloning repository to $INSTALL_DIR"
            fi
        else
            execute "git clone $REPO_URL $INSTALL_DIR" "Cloning repository to $INSTALL_DIR"
        fi
    fi
    
    # Create necessary directories
    execute "mkdir -p $LOG_DIR" "Creating logs directory"
    
    if [ "$ENABLE_TLS" = true ]; then
        execute "mkdir -p $CERTS_DIR" "Creating certificates directory"
    fi
    
    # Navigate to the repository directory
    cd "$INSTALL_DIR"
    log "DEBUG" "Current directory: $(pwd)"
}

# Function to set up environment variables
setup_environment() {
    log "INFO" "Setting up environment variables..."
    
    # Check if .env file already exists
    if [ -f "$ENV_FILE" ]; then
        log "WARN" "Environment file already exists: $ENV_FILE"
        read -p "Do you want to overwrite it? (y/N): " overwrite
        if [[ ! "$overwrite" =~ ^[Yy]$ ]]; then
            log "INFO" "Using existing environment file."
            return
        fi
    fi
    
    # Create .env file from template
    if [ -f "$INSTALL_DIR/.env.example" ]; then
        execute "cp $INSTALL_DIR/.env.example $ENV_FILE" "Creating environment file from template"
    else
        log "WARN" "No .env.example file found. Creating a new .env file."
        touch "$ENV_FILE"
    fi
    
    # Prompt for GitHub token if not provided
    if [ -z "$GITHUB_TOKEN" ]; then
        read -p "Enter your GitHub Personal Access Token: " GITHUB_TOKEN
        if [ -z "$GITHUB_TOKEN" ]; then
            log "ERROR" "GitHub token is required."
            exit 1
        fi
    fi
    
    # Generate API token if not provided
    if [ -z "$API_TOKEN" ]; then
        log "INFO" "Generating a random API token..."
        API_TOKEN=$(generate_random_token)
        log "INFO" "API token generated."
    fi
    
    # Update .env file with provided values
    log "DEBUG" "Updating environment file with provided values..."
    
    # Use sed to update the .env file
    # GitHub Token
    if grep -q "^GITHUB_TOKEN=" "$ENV_FILE"; then
        sed -i "s|^GITHUB_TOKEN=.*|GITHUB_TOKEN=$GITHUB_TOKEN|" "$ENV_FILE"
    else
        echo "GITHUB_TOKEN=$GITHUB_TOKEN" >> "$ENV_FILE"
    fi
    
    # API Token
    if grep -q "^API_TOKEN=" "$ENV_FILE"; then
        sed -i "s|^API_TOKEN=.*|API_TOKEN=$API_TOKEN|" "$ENV_FILE"
    else
        echo "API_TOKEN=$API_TOKEN" >> "$ENV_FILE"
    fi
    
    # MCP Port
    if grep -q "^MCP_PORT=" "$ENV_FILE"; then
        sed -i "s|^MCP_PORT=.*|MCP_PORT=$MCP_PORT|" "$ENV_FILE"
    else
        echo "MCP_PORT=$MCP_PORT" >> "$ENV_FILE"
    fi
    
    # MCP Host
    if grep -q "^MCP_HOST=" "$ENV_FILE"; then
        sed -i "s|^MCP_HOST=.*|MCP_HOST=$MCP_HOST|" "$ENV_FILE"
    else
        echo "MCP_HOST=$MCP_HOST" >> "$ENV_FILE"
    fi
    
    # Log Level
    if grep -q "^LOG_LEVEL=" "$ENV_FILE"; then
        sed -i "s|^LOG_LEVEL=.*|LOG_LEVEL=$LOG_LEVEL|" "$ENV_FILE"
    else
        echo "LOG_LEVEL=$LOG_LEVEL" >> "$ENV_FILE"
    fi
    
    # Log Format
    if grep -q "^LOG_FORMAT=" "$ENV_FILE"; then
        sed -i "s|^LOG_FORMAT=.*|LOG_FORMAT=$LOG_FORMAT|" "$ENV_FILE"
    else
        echo "LOG_FORMAT=$LOG_FORMAT" >> "$ENV_FILE"
    fi
    
    # TLS Settings
    if [ "$ENABLE_TLS" = true ]; then
        if grep -q "^ENABLE_TLS=" "$ENV_FILE"; then
            sed -i "s|^ENABLE_TLS=.*|ENABLE_TLS=true|" "$ENV_FILE"
        else
            echo "ENABLE_TLS=true" >> "$ENV_FILE"
        fi
        
        if [ -n "$TLS_CERT_PATH" ]; then
            if grep -q "^TLS_CERT_PATH=" "$ENV_FILE"; then
                sed -i "s|^TLS_CERT_PATH=.*|TLS_CERT_PATH=$TLS_CERT_PATH|" "$ENV_FILE"
            else
                echo "TLS_CERT_PATH=$TLS_CERT_PATH" >> "$ENV_FILE"
            fi
        fi
        
        if [ -n "$TLS_KEY_PATH" ]; then
            if grep -q "^TLS_KEY_PATH=" "$ENV_FILE"; then
                sed -i "s|^TLS_KEY_PATH=.*|TLS_KEY_PATH=$TLS_KEY_PATH|" "$ENV_FILE"
            else
                echo "TLS_KEY_PATH=$TLS_KEY_PATH" >> "$ENV_FILE"
            fi
        fi
    fi
    
    # Test Repository
    if [ -n "$TEST_REPO" ]; then
        if grep -q "^TEST_REPO=" "$ENV_FILE"; then
            sed -i "s|^TEST_REPO=.*|TEST_REPO=$TEST_REPO|" "$ENV_FILE"
        else
            echo "TEST_REPO=$TEST_REPO" >> "$ENV_FILE"
        fi
    fi
    
    log "INFO" "Environment variables configured successfully."
    log "DEBUG" "Environment file created at: $ENV_FILE"
}

# Function to build and run the server
build_and_run_server() {
    log "INFO" "Building and running the GitHub MCP server..."
    
    case "$INSTALL_MODE" in
        "docker")
            log "INFO" "Using Docker installation mode."
            
            # Export environment variables for Docker
            export GITHUB_TOKEN
            export MCP_PORT
            export MCP_HOST
            export API_TOKEN
            export LOG_LEVEL
            export LOG_FORMAT
            export ENABLE_TLS
            export TLS_CERT_PATH
            export TLS_KEY_PATH
            
            # Check if run-docker.sh exists
            if [ -f "$INSTALL_DIR/run-docker.sh" ]; then
                log "INFO" "Running server using run-docker.sh script..."
                chmod +x "$INSTALL_DIR/run-docker.sh"
                execute "$INSTALL_DIR/run-docker.sh" "Starting Docker container"
            else
                log "INFO" "Building Docker image manually..."
                execute "docker build -t github-mcp-server $INSTALL_DIR" "Building Docker image"
                
                log "INFO" "Starting Docker container..."
                docker_run_cmd="docker run -d -p $MCP_PORT:$MCP_PORT"
                docker_run_cmd+=" -e GITHUB_TOKEN=$GITHUB_TOKEN"
                docker_run_cmd+=" -e MCP_PORT=$MCP_PORT"
                docker_run_cmd+=" -e MCP_HOST=$MCP_HOST"
                docker_run_cmd+=" -e API_TOKEN=$API_TOKEN"
                docker_run_cmd+=" -e LOG_LEVEL=$LOG_LEVEL"
                docker_run_cmd+=" -e LOG_FORMAT=$LOG_FORMAT"
                
                if [ "$ENABLE_TLS" = true ]; then
                    docker_run_cmd+=" -e ENABLE_TLS=true"
                    if [ -n "$TLS_CERT_PATH" ]; then
                        docker_run_cmd+=" -e TLS_CERT_PATH=$TLS_CERT_PATH"
                        docker_run_cmd+=" -v $TLS_CERT_PATH:$TLS_CERT_PATH:ro"
                    fi
                    if [ -n "$TLS_KEY_PATH" ]; then
                        docker_run_cmd+=" -e TLS_KEY_PATH=$TLS_KEY_PATH"
                        docker_run_cmd+=" -v $TLS_KEY_PATH:$TLS_KEY_PATH:ro"
                    fi
                fi
                
                docker_run_cmd+=" -v $LOG_DIR:/server/logs"
                docker_run_cmd+=" --name github-mcp-server"
                docker_run_cmd+=" github-mcp-server"
                
                execute "$docker_run_cmd" "Starting Docker container"
            fi
            
            # Verify container is running
            if docker ps | grep -q github-mcp-server; then
                log "INFO" "Docker container is running."
                log "INFO" "Server is available at http://$MCP_HOST:$MCP_PORT"
            else
                log "ERROR" "Docker container failed to start. Check Docker logs for details."
                log "DEBUG" "Docker logs: $(docker logs github-mcp-server 2>&1)"
                exit 1
            fi
            ;;
            
        "docker-compose")
            log "INFO" "Using Docker Compose installation mode."
            
            # Check if run-docker-compose.sh exists
            if [ -f "$INSTALL_DIR/run-docker-compose.sh" ]; then
                log "INFO" "Running server using run-docker-compose.sh script..."
                chmod +x "$INSTALL_DIR/run-docker-compose.sh"
                
                # Source the environment file
                set -a
                source "$ENV_FILE"
                set +a
                
                execute "$INSTALL_DIR/run-docker-compose.sh" "Starting Docker Compose services"
            else
                log "INFO" "Running Docker Compose manually..."
                
                # Source the environment file
                set -a
                source "$ENV_FILE"
                set +a
                
                execute "cd $INSTALL_DIR && $DOCKER_COMPOSE up -d" "Starting Docker Compose services"
            fi
            
            # Verify container is running
            if docker ps | grep -q github-mcp-server; then
                log "INFO" "Docker container is running."
                log "INFO" "Server is available at http://$MCP_HOST:$MCP_PORT"
            else
                log "ERROR" "Docker container failed to start. Check Docker Compose logs for details."
                log "DEBUG" "Docker Compose logs: $($DOCKER_COMPOSE logs 2>&1)"
                exit 1
            fi
            ;;
            
        "local")
            log "INFO" "Using local installation mode."
            
            # Check if run-mcp-server.sh exists
            if [ -f "$INSTALL_DIR/run-mcp-server.sh" ]; then
                log "INFO" "Running server using run-mcp-server.sh script..."
                chmod +x "$INSTALL_DIR/run-mcp-server.sh"
                
                # Source the environment file
                set -a
                source "$ENV_FILE"
                set +a
                
                # Run in background
                log "INFO" "Starting server in background..."
                nohup "$INSTALL_DIR/run-mcp-server.sh" > "$LOG_DIR/server.log" 2>&1 &
                SERVER_PID=$!
                log "DEBUG" "Server started with PID: $SERVER_PID"
                
                # Wait for server to start
                log "INFO" "Waiting for server to start..."
                sleep 5
                
                # Check if server is running
                if ps -p $SERVER_PID > /dev/null; then
                    log "INFO" "Server is running with PID: $SERVER_PID"
                    log "INFO" "Server is available at http://$MCP_HOST:$MCP_PORT"
                else
                    log "ERROR" "Server failed to start. Check logs for details."
                    log "DEBUG" "Server logs: $(cat $LOG_DIR/server.log)"
                    exit 1
                fi
            else
                log "INFO" "Building and running server manually..."
                
                # Source the environment file
                set -a
                source "$ENV_FILE"
                set +a
                
                # Build the server
                execute "cd $INSTALL_DIR && go build -o github-mcp-server ./cmd/github-mcp-server" "Building server"
                
                # Run in background
                log "INFO" "Starting server in background..."
                nohup "$INSTALL_DIR/github-mcp-server" > "$LOG_DIR/server.log" 2>&1 &
                SERVER_PID=$!
                log "DEBUG" "Server started with PID: $SERVER_PID"
                
                # Wait for server to start
                log "INFO" "Waiting for server to start..."
                sleep 5
                
                # Check if server is running
                if ps -p $SERVER_PID > /dev/null; then
                    log "INFO" "Server is running with PID: $SERVER_PID"
                    log "INFO" "Server is available at http://$MCP_HOST:$MCP_PORT"
                else
                    log "ERROR" "Server failed to start. Check logs for details."
                    log "DEBUG" "Server logs: $(cat $LOG_DIR/server.log)"
                    exit 1
                fi
            fi
            ;;
            
        *)
            log "ERROR" "Invalid installation mode: $INSTALL_MODE"
            exit 1
            ;;
    esac
}

# Function to configure VS Code integration
configure_vscode() {
    if [ "$SKIP_VSCODE" = true ]; then
        log "INFO" "Skipping VS Code integration."
        return
    fi
    
    log "INFO" "Configuring VS Code integration..."
    
    # Create .vscode directory if it doesn't exist
    execute "mkdir -p $VSCODE_DIR" "Creating .vscode directory"
    
    # Create mcp.json file
    log "INFO" "Creating mcp.json configuration file..."
    cat > "$VSCODE_MCP_JSON" << EOF
{
  "version": "1.0.0",
  "description": "GitHub MCP Server configuration for VS Code",
  "server": {
    "url": "\${env:MCP_SERVER_URL}",
    "defaultUrl": "http://$MCP_HOST:$MCP_PORT",
    "apiBasePath": "/api",
    "healthEndpoint": "/health",
    "versionEndpoint": "/version"
  },
  "authentication": {
    "enabled": true,
    "tokenVariable": "API_TOKEN",
    "headerName": "X-API-Token"
  },
  "github": {
    "tokenVariable": "GITHUB_TOKEN",
    "repositories": []
  },
  "endpoints": {
    "search": "/api/search",
    "content": "/api/content",
    "modify": "/api/modify",
    "pull": "/api/pull"
  },
  "features": {
    "codeSearch": true,
    "fileAccess": true,
    "codeModification": true,
    "pullRequests": true
  },
  "logging": {
    "level": "$LOG_LEVEL",
    "format": "$LOG_FORMAT"
  },
  "performance": {
    "requestTimeout": 30000,
    "cacheEnabled": true,
    "cacheTTL": 300
  }
}
EOF
    
    # Create settings.json file
    log "INFO" "Creating VS Code settings.json file..."
    cat > "$VSCODE_SETTINGS_JSON" << EOF
{
  "github-mcp.server.url": "http://$MCP_HOST:$MCP_PORT",
  "github-mcp.server.validateCertificates": true,
  "github-mcp.auth.enabled": true,
  "github-mcp.auth.tokenFromEnv": true,
  "github-mcp.auth.tokenEnvVariable": "API_TOKEN",
  "github-mcp.github.tokenFromEnv": true,
  "github-mcp.github.tokenEnvVariable": "GITHUB_TOKEN",
  
  "github.copilot.advanced": {
    "mcp.enabled": true,
    "mcp.serverUrl": "http://$MCP_HOST:$MCP_PORT"
  },
  
  "terminal.integrated.env.linux": {
    "MCP_SERVER_URL": "http://$MCP_HOST:$MCP_PORT"
  },
  "terminal.integrated.env.osx": {
    "MCP_SERVER_URL": "http://$MCP_HOST:$MCP_PORT"
  },
  "terminal.integrated.env.windows": {
    "MCP_SERVER_URL": "http://$MCP_HOST:$MCP_PORT"
  }
}
EOF
    
    # Create .env.mcp file
    log "INFO" "Creating .env.mcp file..."
    cat > "$ENV_MCP_FILE" << EOF
# GitHub MCP Server Environment Configuration
MCP_SERVER_URL=http://$MCP_HOST:$MCP_PORT
MCP_PORT=$MCP_PORT
MCP_HOST=$MCP_HOST
ENABLE_TLS=$ENABLE_TLS

# Authentication
GITHUB_TOKEN=$GITHUB_TOKEN
API_TOKEN=$API_TOKEN

# Test Repository
TEST_REPO=$TEST_REPO
EOF
    
    log "INFO" "VS Code integration configured successfully."
    log "INFO" "To load environment variables in your terminal:"
    log "INFO" "  For Bash/Zsh: export \$(cat $ENV_MCP_FILE | grep -v \"^#\" | xargs)"
    log "INFO" "  For Windows CMD: set /p %MCP_ENV%<$ENV_MCP_FILE"
    log "INFO" "  For Windows PowerShell: Get-Content $ENV_MCP_FILE | ForEach-Object { \$env:\$(\$_.Split(\"=\")[0])=\$_.Split(\"=\")[1] }"
}

# Function to run tests
run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        log "INFO" "Skipping tests."
        return
    fi
    
    log "INFO" "Running tests to verify installation..."
    
    # Check if test script exists
    if [ -f "$INSTALL_DIR/run-mcp-tests.sh" ]; then
        log "INFO" "Running tests using run-mcp-tests.sh script..."
        chmod +x "$INSTALL_DIR/run-mcp-tests.sh"
        
        # Set environment variables for tests
        export MCP_SERVER_URL="http://$MCP_HOST:$MCP_PORT"
        export GITHUB_TOKEN="$GITHUB_TOKEN"
        if [ -n "$TEST_REPO" ]; then
            export TEST_REPO="$TEST_REPO"
        fi
        
        # Run tests
        if [ "$VERBOSE" = true ]; then
            execute "cd $INSTALL_DIR && ./run-mcp-tests.sh --verbose" "Running tests with verbose output"
        else
            execute "cd $INSTALL_DIR && ./run-mcp-tests.sh" "Running tests"
        fi
    elif [ -f "$INSTALL_DIR/test-github-mcp-server.js" ]; then
        log "INFO" "Running tests using test-github-mcp-server.js script..."
        
        # Set environment variables for tests
        export MCP_SERVER_URL="http://$MCP_HOST:$MCP_PORT"
        export GITHUB_TOKEN="$GITHUB_TOKEN"
        if [ -n "$TEST_REPO" ]; then
            export TEST_REPO="$TEST_REPO"
        fi
        
        # Check if Node.js dependencies are installed
        if [ ! -d "$INSTALL_DIR/node_modules" ]; then
            log "INFO" "Installing Node.js dependencies..."
            execute "cd $INSTALL_DIR && npm install" "Installing Node.js dependencies"
        fi
        
        # Run tests
        execute "cd $INSTALL_DIR && node test-github-mcp-server.js" "Running tests"
    else
        log "WARN" "No test scripts found. Skipping tests."
        return
    fi
    
    log "INFO" "Tests completed successfully."
}

# Function to display installation summary
display_summary() {
    log "INFO" "GitHub MCP Server installation completed successfully!"
    log "INFO" ""
    log "INFO" "Installation Summary:"
    log "INFO" "--------------------"
    log "INFO" "Installation Mode: $INSTALL_MODE"
    log "INFO" "Server URL: http://$MCP_HOST:$MCP_PORT"
    log "INFO" "Installation Directory: $INSTALL_DIR"
    log "INFO" "Environment File: $ENV_FILE"
    log "INFO" "VS Code Configuration: $VSCODE_DIR"
    log "INFO" "Log Directory: $LOG_DIR"
    
    if [ "$INSTALL_MODE" = "docker" ]; then
        log "INFO" ""
        log "INFO" "Docker Container Management:"
        log "INFO" "  - View logs: docker logs github-mcp-server"
        log "INFO" "  - Stop server: docker stop github-mcp-server"
        log "INFO" "  - Start server: docker start github-mcp-server"
        log "INFO" "  - Remove container: docker rm github-mcp-server"
    elif [ "$INSTALL_MODE" = "docker-compose" ]; then
        log "INFO" ""
        log "INFO" "Docker Compose Management:"
        log "INFO" "  - View logs: $DOCKER_COMPOSE logs"
        log "INFO" "  - Stop server: $DOCKER_COMPOSE down"
        log "INFO" "  - Start server: $DOCKER_COMPOSE up -d"
    elif [ "$INSTALL_MODE" = "local" ]; then
        log "INFO" ""
        log "INFO" "Local Server Management:"
        log "INFO" "  - View logs: cat $LOG_DIR/server.log"
        log "INFO" "  - Stop server: kill $SERVER_PID"
        log "INFO" "  - Start server: $INSTALL_DIR/run-mcp-server.sh"
    fi
    
    log "INFO" ""
    log "INFO" "VS Code Integration:"
    log "INFO" "  1. Install required VS Code extensions:"
    log "INFO" "     - GitHub Copilot"
    log "INFO" "     - GitHub Copilot Chat"
    log "INFO" "     - (Optional) GitHub Pull Requests and Issues"
    log "INFO" ""
    log "INFO" "  2. Load environment variables:"
    log "INFO" "     For Bash/Zsh: export \$(cat $ENV_MCP_FILE | grep -v \"^#\" | xargs)"
    log "INFO" "     For Windows CMD: set /p %MCP_ENV%<$ENV_MCP_FILE"
    log "INFO" "     For Windows PowerShell: Get-Content $ENV_MCP_FILE | ForEach-Object { \$env:\$(\$_.Split(\"=\")[0])=\$_.Split(\"=\")[1] }"
    log "INFO" ""
    log "INFO" "  3. Restart VS Code to apply settings"
    log "INFO" ""
    log "INFO" "For more information, see the GitHub MCP Server documentation."
}

# Function to show help message
show_help() {
    echo "GitHub MCP Server All-in-One Installation Script"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --help                  Show this help message"
    echo "  --install-mode=MODE     Installation mode: docker, docker-compose, local (default: docker)"
    echo "  --port=PORT             Port to run the server on (default: 3000)"
    echo "  --host=HOST             Host to bind the server to (default: 0.0.0.0)"
    echo "  --github-token=TOKEN    GitHub Personal Access Token"
    echo "  --api-token=TOKEN       API Token for server authentication"
    echo "  --enable-tls            Enable TLS/HTTPS"
    echo "  --tls-cert=PATH         Path to TLS certificate file"
    echo "  --tls-key=PATH          Path to TLS key file"
    echo "  --log-level=LEVEL       Log level: debug, info, warn, error (default: info)"
    echo "  --log-format=FORMAT     Log format: text, json (default: text)"
    echo "  --skip-clone            Skip repository cloning"
    echo "  --skip-tests            Skip running tests"
    echo "  --skip-vscode           Skip VS Code integration"
    echo "  --repo-path=PATH        Path to existing repository (if --skip-clone is used)"
    echo "  --test-repo=REPO        Test repository in format owner/repo"
    echo "  --verbose               Enable verbose output"
    echo ""
    echo "Examples:"
    echo "  $0 --install-mode=docker --port=3000 --github-token=your_token"
    echo "  $0 --install-mode=docker-compose --enable-tls --tls-cert=/path/to/cert.pem --tls-key=/path/to/key.pem"
    echo "  $0 --install-mode=local --skip-clone --repo-path=/path/to/repo --verbose"
    echo ""
    exit 0
}

# Parse command-line arguments
parse_args() {
    for arg in "$@"; do
        case $arg in
            --help)
                show_help
                ;;
            --install-mode=*)
                INSTALL_MODE="${arg#*=}"
                ;;
            --port=*)
                MCP_PORT="${arg#*=}"
                ;;
            --host=*)
                MCP_HOST="${arg#*=}"
                ;;
            --github-token=*)
                GITHUB_TOKEN="${arg#*=}"
                ;;
            --api-token=*)
                API_TOKEN="${arg#*=}"
                ;;
            --enable-tls)
                ENABLE_TLS=true
                ;;
            --tls-cert=*)
                TLS_CERT_PATH="${arg#*=}"
                ;;
            --tls-key=*)
                TLS_KEY_PATH="${arg#*=}"
                ;;
            --log-level=*)
                LOG_LEVEL="${arg#*=}"
                ;;
            --log-format=*)
                LOG_FORMAT="${arg#*=}"
                ;;
            --skip-clone)
                SKIP_CLONE=true
                ;;
            --skip-tests)
                SKIP_TESTS=true
                ;;
            --skip-vscode)
                SKIP_VSCODE=true
                ;;
            --repo-path=*)
                REPO_PATH="${arg#*=}"
                ;;
            --test-repo=*)
                TEST_REPO="${arg#*=}"
                ;;
            --verbose)
                VERBOSE=true
                ;;
            *)
                log "ERROR" "Unknown option: $arg"
                show_help
                ;;
        esac
    done
    
    # Validate arguments
    if [ "$ENABLE_TLS" = true ] && ([ -z "$TLS_CERT_PATH" ] || [ -z "$TLS_KEY_PATH" ]); then
        log "ERROR" "TLS is enabled but certificate or key path is missing."
        exit 1
    fi
    
    if [ "$SKIP_CLONE" = true ] && [ -z "$REPO_PATH" ]; then
        log "ERROR" "Repository path must be specified when using --skip-clone."
        exit 1
    fi
}

# Main execution flow
main() {
    # Parse command-line arguments
    parse_args "$@"
    
    # Display banner
    log "INFO" "Starting GitHub MCP Server installation..."
    log "INFO" "Installation mode: $INSTALL_MODE"
    
    # Check prerequisites
    check_prerequisites
    
    # Clone repository
    clone_repository
    
    # Set up environment variables
    setup_environment
    
    # Build and run server
    build_and_run_server
    
    # Configure VS Code integration
    configure_vscode
    
    # Run tests
    run_tests
    
    # Display installation summary
    display_summary
    
    log "INFO" "Installation completed successfully!"
}

# Execute main function with all arguments
main "$@"
