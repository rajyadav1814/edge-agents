#!/bin/bash

# SPARC2 Example 7: Advanced Workflow
# This example demonstrates a complete workflow integrating multiple SPARC2 features
# including different processing modes and an end-to-end refactoring scenario

# Set strict mode
set -e

# Change to the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

echo "SPARC2 Example 7: Advanced Workflow"
echo "=================================="
echo ""

# Create a project directory for our example
PROJECT_DIR="sparc2-advanced-example"
mkdir -p $PROJECT_DIR
cd $PROJECT_DIR

echo "Created project directory: $PROJECT_DIR"
echo ""

# Create a small application with multiple files that need refactoring
echo "Creating a sample application with multiple files..."

# Create a main application file
cat > "app.js" << EOL
/**
 * Main application file
 */
const userService = require('./services/user-service');
const dataService = require('./services/data-service');

// Problematic code: Global variables
var users = [];
var data = [];

// Bad function: Uses global variables, no error handling, poor naming
function doStuff() {
  try {
    users = userService.getUsers();
    data = dataService.getData();
    
    for (var i = 0; i < users.length; i++) {
      var u = users[i];
      for (var j = 0; j < data.length; j++) {
        var d = data[j];
        if (u.id === d.userId) {
          u.data = d;
        }
      }
    }
    
    return users;
  } catch (e) {
    console.log('Error:', e);
  }
}

// Outdated callback pattern
function saveData(callback) {
  setTimeout(function() {
    try {
      users.forEach(function(user) {
        userService.saveUser(user, function(err) {
          if (err) console.log('Error saving user:', err);
        });
      });
      callback(null, 'Success');
    } catch (e) {
      callback(e);
    }
  }, 100);
}

module.exports = {
  doStuff,
  saveData,
  users,
  data
};
EOL

# Create a directory for services
mkdir -p services

# Create a user service with code smells
cat > "services/user-service.js" << EOL
/**
 * User service
 */

// Hardcoded data - should be in a database
const USERS = [
  { id: 1, name: 'John', age: 30 },
  { id: 2, name: 'Jane', age: 25 },
  { id: 3, name: 'Bob', age: 40 }
];

// Duplicate code pattern across services
function getUsers() {
  console.log('Getting users...');
  return USERS;
}

// Inconsistent error handling
function saveUser(user, callback) {
  setTimeout(function() {
    if (!user.id) {
      callback(new Error('User ID is required'));
      return;
    }
    
    console.log('User saved:', user);
    callback(null);
  }, 100);
}

// Inconsistent method pattern (promises vs callbacks)
function findUserById(id) {
  return new Promise((resolve, reject) => {
    const user = USERS.find(u => u.id === id);
    if (user) {
      resolve(user);
    } else {
      reject(new Error('User not found'));
    }
  });
}

module.exports = {
  getUsers,
  saveUser,
  findUserById
};
EOL

# Create a data service with similar issues
cat > "services/data-service.js" << EOL
/**
 * Data service
 */

// Hardcoded data - should be in a database
const DATA = [
  { id: 101, userId: 1, value: 'ABC' },
  { id: 102, userId: 2, value: 'DEF' },
  { id: 103, userId: 3, value: 'GHI' },
  { id: 104, userId: 1, value: 'JKL' }
];

// Duplicate code pattern across services
function getData() {
  console.log('Getting data...');
  return DATA;
}

// Different error handling from user service
function saveData(data) {
  return new Promise((resolve, reject) => {
    if (!data.id) {
      throw new Error('Data ID is required');
    }
    
    console.log('Data saved:', data);
    resolve(true);
  });
}

module.exports = {
  getData,
  saveData
};
EOL

echo "Sample application created with intentional code smells and issues."
echo ""

# Set up advanced SPARC2 configuration
echo "Setting up advanced SPARC2 configuration..."
cd ..

# Change execution mode to swarm for parallel processing
echo "Changing execution mode to swarm processing..."
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts config \
  --action set --key "execution.processing" --value "swarm"

echo "Enabling function-level diff tracking for more granular analysis..."
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts config \
  --action set --key "execution.diff_mode" --value "function"

echo ""
echo "Advanced configuration set."
echo ""

# Run analysis on all files
echo "Running analysis on all project files simultaneously (swarm mode)..."
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts analyze \
  --files "$PROJECT_DIR/app.js,$PROJECT_DIR/services/user-service.js,$PROJECT_DIR/services/data-service.js" \
  --output "$PROJECT_DIR/analysis-results.json"

echo ""
echo "Analysis complete. Results saved to $PROJECT_DIR/analysis-results.json"
echo ""

# Use analysis results to create a refactoring plan
echo "Creating a structured refactoring plan based on analysis..."
cat > "$PROJECT_DIR/refactoring-plan.md" << EOL
# Refactoring Plan

Based on the SPARC2 analysis, the following issues need to be addressed:

## App.js
1. Replace global variables with proper state management
2. Improve function naming (doStuff -> mergeUserData)
3. Add proper error handling
4. Convert callbacks to promises/async-await
5. Improve code readability with modern JS patterns

## User Service
1. Replace hardcoded data with a configurable data source
2. Standardize error handling
3. Ensure consistent method patterns (all promises)
4. Remove console.log statements, use proper logging

## Data Service
1. Match the patterns used in the user service
2. Fix inconsistent error handling
3. Implement consistent method signatures

## Overall
1. Implement consistent coding standards
2. Add proper documentation
3. Fix potential memory leaks
EOL

echo "Refactoring plan created: $PROJECT_DIR/refactoring-plan.md"
echo ""

# Execute the refactoring
echo "Now we can execute SPARC2 to implement this refactoring plan."
echo "In a real scenario, you would run:"
echo "deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts modify \\"
echo "  --files \"$PROJECT_DIR/app.js,$PROJECT_DIR/services/user-service.js,$PROJECT_DIR/services/data-service.js\" \\"
echo "  --suggestions \"$PROJECT_DIR/refactoring-plan.md\""
echo ""

echo "Once the modifications are complete, you would create a checkpoint:"
echo "deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts checkpoint \\"
echo "  --message \"Complete application refactoring\""
echo ""

echo "This advanced workflow demonstrates how SPARC2 can be used for:"
echo "1. Multi-file analysis using swarm processing"
echo "2. Function-level diff tracking for precise changes"
echo "3. Creating detailed refactoring plans"
echo "4. Implementing complex changes across a codebase"
echo "5. Version tracking for significant refactorings"
echo ""

echo "In a production environment, you would integrate these steps into your CI/CD pipeline"
echo "to automate code quality improvements and refactoring tasks."

# Cleanup
rm -rf "$PROJECT_DIR"
echo "Cleaned up example project."

# Restore original configuration
echo "Restoring original configuration..."
deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts config \
  --action set --key "execution.processing" --value "parallel"

deno run --allow-read --allow-write --allow-env --allow-net --allow-run src/cli/cli.ts config \
  --action set --key "execution.diff_mode" --value "file"

echo "Configuration restored."