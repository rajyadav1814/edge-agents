#!/bin/bash

# Script to import SQL files into PostgreSQL database
# Usage: import-sql.sh [directory_path]

set -e

# Default directory is /sql if not provided
SQL_DIR=${1:-/sql}

# Check if directory exists
if [ ! -d "$SQL_DIR" ]; then
  echo "Error: Directory $SQL_DIR does not exist"
  exit 1
fi

# Count SQL files
SQL_FILES=$(find "$SQL_DIR" -name "*.sql" | sort)
FILE_COUNT=$(echo "$SQL_FILES" | wc -l)

if [ "$FILE_COUNT" -eq 0 ]; then
  echo "No SQL files found in $SQL_DIR"
  exit 0
fi

echo "Found $FILE_COUNT SQL files to import"

# Import each SQL file
for SQL_FILE in $SQL_FILES; do
  echo "Importing $SQL_FILE..."
  PGPASSWORD=$POSTGRES_PASSWORD psql -h localhost -U $POSTGRES_USER -d $POSTGRES_DB -f "$SQL_FILE"
  
  if [ $? -eq 0 ]; then
    echo "Successfully imported $SQL_FILE"
  else
    echo "Error importing $SQL_FILE"
    exit 1
  fi
done

echo "All SQL files imported successfully"
