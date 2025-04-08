# Extending Mastra AI Agent with Custom Tools

This guide explains how to extend the Mastra AI agent by creating and integrating custom tools. Tools are modular components that give the agent specific capabilities, such as fetching weather data, performing calculations, or integrating with external APIs.

## Understanding the Tool Architecture

In the Mastra AI agent, tools follow a consistent structure:

1. **Tool Definition**: A TypeScript object that implements the `Tool` interface
2. **Input Validation**: Schema-based validation using Zod
3. **Execution Logic**: The core functionality that performs the tool's task
4. **Registration**: Adding the tool to the agent's available tools

## Tool Interface

All tools must implement the `Tool` interface defined in `types/index.ts`:

```typescript
export interface Tool {
  /**
   * Unique identifier for the tool
   */
  id: string;
  
  /**
   * Human-readable description of the tool
   */
  description: string;
  
  /**
   * Function to execute the tool
   */
  execute: (params: ToolExecuteParams) => Promise<unknown>;
}

export interface ToolExecuteParams {
  /**
   * Context or arguments for the tool
   */
  context: Record<string, unknown>;
}
```

## Creating a Basic Tool

Let's create a simple calculator tool that performs basic arithmetic operations.

### Step 1: Create the Tool File

Create a new file `tools/calculator.ts`:

```typescript
/**
 * Calculator tool for the Mastra AI agent
 * 
 * This tool performs basic arithmetic operations.
 */

import { z } from "zod";
import { Tool, ToolExecuteParams } from "../types/index.ts";

/**
 * Input schema for the calculator tool
 */
const calculatorInputSchema = z.object({
  expression: z.string().min(1, "Expression is required"),
});

/**
 * Type for calculator tool input
 */
type CalculatorInput = z.infer<typeof calculatorInputSchema>;

/**
 * Type for calculator tool output
 */
interface CalculatorOutput {
  result: number;
  expression: string;
}

/**
 * Implementation of the calculator tool
 */
export const calculatorTool: Tool = {
  id: "calculator",
  description: "Calculate the result of a mathematical expression",
  
  /**
   * Execute the calculator tool
   * 
   * @param params Tool execution parameters
   * @returns The calculation result
   */
  execute: async (params: ToolExecuteParams): Promise<CalculatorOutput> => {
    try {
      // Validate input
      const input = calculatorInputSchema.parse(params.context) as CalculatorInput;
      const { expression } = input;
      
      // For security, we'll implement a simple parser instead of using eval()
      // This is a basic implementation that handles +, -, *, and /
      const result = calculateExpression(expression);
      
      return {
        result,
        expression
      };
    } catch (error: unknown) {
      console.error("Error in calculator tool:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to calculate: ${errorMessage}`);
    }
  }
};

/**
 * Calculate the result of a mathematical expression
 * 
 * @param expression The expression to calculate
 * @returns The calculated result
 */
function calculateExpression(expression: string): number {
  // This is a simplified implementation
  // In a production environment, use a proper math expression parser
  
  // Remove all whitespace
  const sanitized = expression.replace(/\s+/g, '');
  
  // Simple validation to prevent code injection
  if (!/^[0-9+\-*/().]+$/.test(sanitized)) {
    throw new Error("Invalid expression. Only numbers and basic operators (+, -, *, /) are allowed.");
  }
  
  // Use Function constructor instead of eval for slightly better security
  // Still not recommended for production without proper sanitization
  try {
    // Create a function that returns the result of the expression
    const calculate = new Function(`return ${sanitized}`);
    return calculate();
  } catch (error) {
    throw new Error(`Invalid expression: ${expression}`);
  }
}

export default calculatorTool;
```

### Step 2: Register the Tool

Update `tools/index.ts` to include your new tool:

```typescript
/**
 * Tools module index for the Mastra AI agent
 * 
 * This module exports all tool components for easy access.
 */

import { weatherTool } from "./weather.ts";
import { calculatorTool } from "./calculator.ts";
import { Tool } from "../types/index.ts";

/**
 * Collection of all available tools for the Mastra AI agent
 */
export const tools: Tool[] = [
  weatherTool,
  calculatorTool,
  // Add more tools here as they are implemented
];

// Rest of the file remains unchanged...
```

## Creating a Tool with External API Integration

Now, let's create a more complex tool that integrates with an external API. We'll implement a currency conversion tool.

### Step 1: Create the Tool File

Create a new file `tools/currency-converter.ts`:

```typescript
/**
 * Currency converter tool for the Mastra AI agent
 * 
 * This tool converts between different currencies using an external API.
 */

import { z } from "zod";
import { Tool, ToolExecuteParams } from "../types/index.ts";
import { config } from "../config/index.ts";

/**
 * Input schema for the currency converter tool
 */
const currencyConverterInputSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  from: z.string().length(3, "Currency code must be 3 characters"),
  to: z.string().length(3, "Currency code must be 3 characters"),
});

/**
 * Type for currency converter tool input
 */
type CurrencyConverterInput = z.infer<typeof currencyConverterInputSchema>;

/**
 * Type for currency converter tool output
 */
interface CurrencyConverterOutput {
  amount: number;
  convertedAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: string;
}

/**
 * Implementation of the currency converter tool
 */
export const currencyConverterTool: Tool = {
  id: "currency-converter",
  description: "Convert an amount from one currency to another",
  
  /**
   * Execute the currency converter tool
   * 
   * @param params Tool execution parameters
   * @returns The conversion result
   */
  execute: async (params: ToolExecuteParams): Promise<CurrencyConverterOutput> => {
    try {
      // Validate input
      const input = currencyConverterInputSchema.parse(params.context) as CurrencyConverterInput;
      const { amount, from, to } = input;
      
      // Get API key from environment variables
      const apiKey = config.api.currencyApiKey;
      
      // Check if API key is configured
      if (!apiKey) {
        console.error("Currency API key is not configured");
        // Return mock data for demonstration purposes
        return getMockConversionData(amount, from, to);
      }
      
      // Make API call to currency conversion service
      // Replace with your preferred currency API
      const response = await fetch(
        `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}&apikey=${apiKey}`
      );
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform API response to our output format
      return {
        amount: amount,
        convertedAmount: data.result,
        fromCurrency: from,
        toCurrency: to,
        rate: data.info.rate,
        timestamp: new Date(data.info.timestamp * 1000).toISOString()
      };
    } catch (error: unknown) {
      console.error("Error in currency converter tool:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to convert currency: ${errorMessage}`);
    }
  }
};

/**
 * Get mock conversion data for demonstration purposes
 * 
 * @param amount The amount to convert
 * @param from The source currency
 * @param to The target currency
 * @returns Mock conversion data
 */
function getMockConversionData(amount: number, from: string, to: string): CurrencyConverterOutput {
  // Mock exchange rates for demonstration
  const mockRates: Record<string, number> = {
    "USD_EUR": 0.85,
    "EUR_USD": 1.18,
    "USD_GBP": 0.75,
    "GBP_USD": 1.33,
    "EUR_GBP": 0.88,
    "GBP_EUR": 1.14
  };
  
  // Get the exchange rate or use a default
  const rateKey = `${from}_${to}`;
  const rate = mockRates[rateKey] || 1;
  
  // Calculate the converted amount
  const convertedAmount = amount * rate;
  
  return {
    amount,
    convertedAmount,
    fromCurrency: from,
    toCurrency: to,
    rate,
    timestamp: new Date().toISOString()
  };
}

export default currencyConverterTool;
```

### Step 2: Update Configuration

Add the currency API key to your configuration in `config/index.ts`:

```typescript
/**
 * API keys for external services
 */
interface ApiKeys {
  weatherApiKey: string | undefined | null;
  currencyApiKey: string | undefined | null;
  isConfigured(key: keyof Omit<ApiKeys, 'isConfigured'>): boolean;
}

export const apiKeys: ApiKeys = {
  /**
   * Weather API key for weather service integration
   */
  weatherApiKey: Deno.env.get("WEATHER_API_KEY") || null,
  
  /**
   * Currency API key for currency conversion
   */
  currencyApiKey: Deno.env.get("CURRENCY_API_KEY") || null,
  
  /**
   * Validates if a specific API key is properly configured
   * @param key The name of the API key to check
   * @returns True if the key is configured, false otherwise
   */
  isConfigured(key: keyof Omit<ApiKeys, 'isConfigured'>): boolean {
    return !!(this[key]);
  }
};
```

### Step 3: Update Environment Variables

Add the new API key to your `.env.example` file:

```
# API Keys
WEATHER_API_KEY=your-weather-api-key
CURRENCY_API_KEY=your-currency-api-key
# Add other API keys as needed
```

### Step 4: Register the Tool

Update `tools/index.ts` to include your new currency converter tool:

```typescript
import { weatherTool } from "./weather.ts";
import { calculatorTool } from "./calculator.ts";
import { currencyConverterTool } from "./currency-converter.ts";
import { Tool } from "../types/index.ts";

export const tools: Tool[] = [
  weatherTool,
  calculatorTool,
  currencyConverterTool,
  // Add more tools here as they are implemented
];

// Rest of the file remains unchanged...
```

## Best Practices for Tool Development

When creating tools for the Mastra AI agent, follow these best practices:

### 1. Input Validation

Always validate input using Zod schemas to ensure your tool receives the expected data format. This prevents runtime errors and improves security.

```typescript
const inputSchema = z.object({
  // Define your schema properties
  param1: z.string().min(1, "Parameter is required"),
  param2: z.number().positive("Number must be positive"),
});

// Use the schema to validate input
const input = inputSchema.parse(params.context);
```

### 2. Error Handling

Implement comprehensive error handling to provide meaningful error messages and prevent the agent from crashing.

```typescript
try {
  // Tool implementation
} catch (error: unknown) {
  console.error("Error in tool:", error);
  const errorMessage = error instanceof Error ? error.message : String(error);
  throw new Error(`Failed to execute tool: ${errorMessage}`);
}
```

### 3. Environment Variable Management

Access API keys and other sensitive information through environment variables, never hardcode them.

```typescript
const apiKey = config.api.yourApiKey;

if (!apiKey) {
  console.error("API key is not configured");
  // Handle missing API key gracefully
}
```

### 4. Graceful Degradation

Provide fallback behavior when external services are unavailable or API keys are missing.

```typescript
if (!apiKey || !externalServiceAvailable()) {
  return getMockData(); // Return mock data instead of failing
}
```

### 5. Typed Inputs and Outputs

Use TypeScript types for both inputs and outputs to improve code quality and documentation.

```typescript
// Input type
type ToolInput = z.infer<typeof inputSchema>;

// Output interface
interface ToolOutput {
  result: string;
  timestamp: string;
  // Other output properties
}
```

### 6. Documentation

Document your tool thoroughly with JSDoc comments to make it easier for other developers to understand and use.

```typescript
/**
 * This tool performs a specific function
 * 
 * @param params Tool execution parameters
 * @returns The result of the operation
 * @throws Error if the operation fails
 */
```

## Testing Your Tools

Create tests for your tools to ensure they work correctly:

```typescript
// tests/calculator.test.ts
import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";
import { calculatorTool } from "../tools/calculator.ts";

Deno.test("Calculator tool - basic addition", async () => {
  const result = await calculatorTool.execute({
    context: { expression: "2 + 2" }
  });
  
  assertEquals(result.result, 4);
  assertEquals(result.expression, "2 + 2");
});

Deno.test("Calculator tool - invalid expression", async () => {
  await assertThrows(
    async () => {
      await calculatorTool.execute({
        context: { expression: "2 + * 2" }
      });
    },
    Error,
    "Invalid expression"
  );
});
```

Run your tests with:

```bash
deno test --allow-env --allow-net
```

## Conclusion

By following this guide, you can extend the Mastra AI agent with custom tools that enhance its capabilities. Whether you're integrating with external APIs, performing calculations, or adding other functionality, the modular tool architecture makes it easy to add new features to your agent.

Remember to follow best practices for security, error handling, and documentation to ensure your tools are robust and maintainable.