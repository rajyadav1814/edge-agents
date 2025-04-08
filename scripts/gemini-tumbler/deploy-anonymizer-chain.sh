#!/bin/bash
# Deploy the anonymizer daisy chain to Supabase Edge Functions

# Exit on error
set -e

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "Error: Supabase CLI is not installed. Please install it first."
  echo "See: https://supabase.com/docs/guides/cli"
  exit 1
fi

# Check if we're logged in
if ! supabase functions list &> /dev/null; then
  echo "Error: Not logged in to Supabase. Please run 'supabase login' first."
  exit 1
fi

# Create temporary deployment directory
TEMP_DIR=$(mktemp -d)
echo "Created temporary directory: $TEMP_DIR"

# Copy files to temporary directory
mkdir -p "$TEMP_DIR/anonymizer/utils"
mkdir -p "$TEMP_DIR/processor/utils"
mkdir -p "$TEMP_DIR/finalizer"

# Copy anonymizer files
cp scripts/gemini-tumbler/src/utils/anonymizer.ts "$TEMP_DIR/anonymizer/utils/"
cp scripts/gemini-tumbler/src/api/anonymizer-edge-function.ts "$TEMP_DIR/anonymizer/index.ts"

# Copy processor files
cp scripts/gemini-tumbler/src/utils/anonymizer.ts "$TEMP_DIR/processor/utils/"
cp scripts/gemini-tumbler/src/api/processor-edge-function.ts "$TEMP_DIR/processor/index.ts"

# Copy finalizer files
cp scripts/gemini-tumbler/src/api/finalizer-edge-function.ts "$TEMP_DIR/finalizer/index.ts"

# Create deno.json files
cat > "$TEMP_DIR/anonymizer/deno.json" << EOF
{
  "tasks": {
    "deploy": "supabase functions deploy anonymizer"
  },
  "compilerOptions": {
    "allowJs": true,
    "strict": true
  }
}
EOF

cat > "$TEMP_DIR/processor/deno.json" << EOF
{
  "tasks": {
    "deploy": "supabase functions deploy processor"
  },
  "compilerOptions": {
    "allowJs": true,
    "strict": true
  }
}
EOF

cat > "$TEMP_DIR/finalizer/deno.json" << EOF
{
  "tasks": {
    "deploy": "supabase functions deploy finalizer"
  },
  "compilerOptions": {
    "allowJs": true,
    "strict": true
  }
}
EOF

# Deploy the functions
echo "Deploying anonymizer function..."
cd "$TEMP_DIR/anonymizer"
supabase functions deploy anonymizer

echo "Deploying processor function..."
cd "$TEMP_DIR/processor"
supabase functions deploy processor

echo "Deploying finalizer function..."
cd "$TEMP_DIR/finalizer"
supabase functions deploy finalizer

# Clean up
echo "Cleaning up temporary directory..."
rm -rf "$TEMP_DIR"

# Get function URLs
ANONYMIZER_URL=$(supabase functions get-url anonymizer)
PROCESSOR_URL=$(supabase functions get-url processor)
FINALIZER_URL=$(supabase functions get-url finalizer)

echo "Deployment complete!"
echo "Anonymizer URL: $ANONYMIZER_URL"
echo "Processor URL: $PROCESSOR_URL"
echo "Finalizer URL: $FINALIZER_URL"

echo ""
echo "To set up the daisy chain, configure the following secrets:"
echo "supabase secrets set NEXT_FUNCTION_ENDPOINT=$PROCESSOR_URL --env anonymizer"
echo "supabase secrets set NEXT_FUNCTION_ENDPOINT=$FINALIZER_URL --env processor"

echo ""
echo "Don't forget to set other required secrets:"
echo "supabase secrets set SUPABASE_URL=your-supabase-url"
echo "supabase secrets set SUPABASE_ANON_KEY=your-anon-key"
echo "supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
echo "supabase secrets set ANONYMIZER_SALT=your-random-salt"
echo "supabase secrets set STORAGE_TABLE=your-table-name"