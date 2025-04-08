#!/bin/bash
# Simple wrapper script for the SPARC2 CLI

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the CLI with the provided arguments
"$DIR/cli" "$@"