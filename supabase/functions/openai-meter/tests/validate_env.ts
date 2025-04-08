/**
 * Environment validation for OpenAI proxy
 */

interface EnvVar {
  name: string;
  required: boolean;
  validate?: (value: string) => boolean;
  example?: string;
}

const envVars: EnvVar[] = [
  // OpenAI Configuration
  {
    name: "OPENAI_API_KEY",
    required: true,
    validate: (v) => v.startsWith("sk-"),
    example: "sk-...",
  },
  {
    name: "OPENAI_API_BASE_URL",
    required: false,
    validate: (v) => v.startsWith("http"),
    example: "https://api.openai.com/v1",
  },
  {
    name: "OPENAI_API_VERSION",
    required: false,
    example: "2023-05-15",
  },

  // Azure OpenAI Configuration
  {
    name: "AZURE_OPENAI_API_KEY",
    required: false,
    example: "azure-key...",
  },
  {
    name: "AZURE_OPENAI_ENDPOINT",
    required: false,
    validate: (v) => v.startsWith("http"),
    example: "https://<resource>.openai.azure.com/",
  },

  // Anthropic Configuration
  {
    name: "ANTHROPIC_API_KEY",
    required: false,
    example: "sk-ant-...",
  },

  // Stripe Configuration
  {
    name: "STRIPE_SECRET_KEY",
    required: true,
    validate: (v) => v.startsWith("sk_"),
    example: "sk_...",
  },
  {
    name: "STRIPE_WEBHOOK_SECRET",
    required: true,
    validate: (v) => v.startsWith("whsec_"),
    example: "whsec_...",
  },
  {
    name: "STRIPE_PRICE_ID",
    required: true,
    validate: (v) => v.startsWith("price_"),
    example: "price_...",
  },

  // Rate Limiting
  {
    name: "RATE_LIMIT_MAX",
    required: false,
    validate: (v) => !isNaN(Number(v)) && Number(v) > 0,
    example: "100",
  },
  {
    name: "RATE_LIMIT_WINDOW",
    required: false,
    validate: (v) => !isNaN(Number(v)) && Number(v) > 0,
    example: "60000",
  },

  // Security
  {
    name: "ALLOWED_ORIGINS",
    required: false,
    validate: (v) => {
      try {
        const origins = JSON.parse(v);
        return Array.isArray(origins) && origins.every(o => typeof o === "string");
      } catch {
        return false;
      }
    },
    example: '["https://example.com"]',
  },
];

interface ValidationResult {
  valid: boolean;
  missing: string[];
  invalid: { name: string; error: string }[];
}

/**
 * Validates environment variables
 */
export function validateEnv(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    missing: [],
    invalid: [],
  };

  for (const envVar of envVars) {
    const value = Deno.env.get(envVar.name);

    // Check required variables
    if (envVar.required && !value) {
      result.valid = false;
      result.missing.push(envVar.name);
      continue;
    }

    // Validate value format if present
    if (value && envVar.validate && !envVar.validate(value)) {
      result.valid = false;
      result.invalid.push({
        name: envVar.name,
        error: `Invalid format. Example: ${envVar.example}`,
      });
    }
  }

  return result;
}

/**
 * Prints validation results
 */
export function printValidationResults(results: ValidationResult): void {
  if (results.valid) {
    console.log("✅ Environment validation passed");
    return;
  }

  console.log("❌ Environment validation failed");

  if (results.missing.length > 0) {
    console.log("\nMissing required variables:");
    results.missing.forEach(name => {
      const envVar = envVars.find(v => v.name === name);
      console.log(`  ${name} - Example: ${envVar?.example}`);
    });
  }

  if (results.invalid.length > 0) {
    console.log("\nInvalid variables:");
    results.invalid.forEach(({ name, error }) => {
      console.log(`  ${name} - ${error}`);
    });
  }
}

// Run validation if executed directly
if (import.meta.main) {
  const results = validateEnv();
  printValidationResults(results);
  if (!results.valid) {
    Deno.exit(1);
  }
}