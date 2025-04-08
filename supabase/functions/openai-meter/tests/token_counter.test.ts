import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { TokenCounter } from "../utils/token-counter.ts";
import { ChatMessage } from "../api-contract.ts";

Deno.test({
  name: "Token Counter Tests",
  fn: async (t) => {
    const counter = new TokenCounter();

    await t.step("should count tokens in simple messages", async () => {
      const messages: ChatMessage[] = [
        {
          role: "user",
          content: "Hello, how are you?",
        },
      ];
      const count = await counter.countTokens(messages);
      assertEquals(count > 0, true);
    });

    await t.step("should handle system messages", async () => {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: "You are a helpful assistant that speaks English.",
        },
      ];
      const count = await counter.countTokens(messages);
      assertEquals(count > 0, true);
    });

    await t.step("should handle function messages", async () => {
      const messages: ChatMessage[] = [
        {
          role: "function",
          name: "get_weather",
          content: JSON.stringify({
            temperature: 72,
            conditions: "sunny",
          }),
        },
      ];
      const count = await counter.countTokens(messages);
      assertEquals(count > 0, true);
    });

    await t.step("should handle conversation history", async () => {
      const messages: ChatMessage[] = [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: "What's the weather like?",
        },
        {
          role: "assistant",
          content: "I'll check that for you.",
        },
        {
          role: "function",
          name: "get_weather",
          content: JSON.stringify({
            temperature: 72,
            conditions: "sunny",
          }),
        },
        {
          role: "assistant",
          content: "It's 72 degrees and sunny today!",
        },
      ];
      const count = await counter.countTokens(messages);
      assertEquals(count > 0, true);
      assertEquals(typeof count, "number");
    });

    await t.step("should handle empty messages", async () => {
      const messages: ChatMessage[] = [];
      const count = await counter.countTokens(messages);
      assertEquals(count, 0);
    });

    await t.step("should handle messages with special characters", async () => {
      const messages: ChatMessage[] = [
        {
          role: "user",
          content: "Hello! 👋 How are you? 🤔",
        },
      ];
      const count = await counter.countTokens(messages);
      assertEquals(count > 0, true);
    });

    await t.step("should handle long messages", async () => {
      const longText = "This is a very long message. ".repeat(100);
      const messages: ChatMessage[] = [
        {
          role: "user",
          content: longText,
        },
      ];
      const count = await counter.countTokens(messages);
      assertEquals(count > 100, true); // Should be significantly more than 100 tokens
    });

    await t.step("should handle code blocks", async () => {
      const messages: ChatMessage[] = [
        {
          role: "user",
          content: `Here's some code:
\`\`\`typescript
function hello() {
  console.log("Hello, world!");
}
\`\`\``,
        },
      ];
      const count = await counter.countTokens(messages);
      assertEquals(count > 0, true);
    });
  },
});