import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import { Fixtures } from "./test_fixtures.ts";
import { createTestContext, type TestContext } from "./test_context.ts";

/**
 * Integration tests for OpenAI proxy with Stripe metering
 */
Deno.test("OpenAI proxy integration tests", async (t) => {
  const ctx: TestContext = createTestContext();

  // Mock environment variables
  const cleanup = ctx.mockEnv(Fixtures.env.valid);

  await t.step("complete request flow with metering", async () => {
    // Mock responses for the complete flow
    ctx.mockFetch([
      // OpenAI API response
      new Response(JSON.stringify(Fixtures.responses.success.chat), { status: 200 }),
      // Stripe metering API response
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ]);

    const response = await fetch("http://localhost:8000/v1/chat/completions", {
      method: "POST",
      headers: Fixtures.headers.valid,
      body: JSON.stringify(Fixtures.requests.chat.valid),
    });

    assertEquals(response.status, 200);
    const data = await response.json();
    assertEquals(data.choices[0].message.content, "Hello! I'm doing well, thank you for asking. How are you?");

    // Verify metering was recorded
    const calls = ctx.getMockFetchCalls();
    assertEquals(calls.length, 2);
    assertEquals(calls[1].url.includes("/v1/subscription_items"), true);
  });

  await t.step("provider fallback chain", async () => {
    // Mock responses for fallback chain
    ctx.mockFetch([
      // OpenAI failure
      new Response(JSON.stringify(Fixtures.responses.error.rateLimit), { status: 429 }),
      // Azure success
      new Response(JSON.stringify(Fixtures.responses.success.chat), { status: 200 }),
      // Stripe metering
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ]);

    const response = await fetch("http://localhost:8000/v1/chat/completions", {
      method: "POST",
      headers: Fixtures.headers.valid,
      body: JSON.stringify(Fixtures.requests.chat.valid),
    });

    assertEquals(response.status, 200);
    const data = await response.json();
    assertEquals(data.choices[0].message.content, "Hello! I'm doing well, thank you for asking. How are you?");

    // Verify fallback occurred
    const calls = ctx.getMockFetchCalls();
    assertEquals(calls.length, 3);
    assertEquals(calls[1].headers.get("x-provider"), "azure");
  });

  await t.step("streaming with metering", async () => {
    // Mock responses for streaming
    ctx.mockFetch([
      // Streaming response
      new Response(
        Fixtures.responses.streaming.chunks
          .map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`)
          .join("") + "data: [DONE]\n\n",
        {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        }
      ),
      // Stripe metering
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ]);

    const response = await fetch("http://localhost:8000/v1/chat/completions", {
      method: "POST",
      headers: {
        ...Fixtures.headers.valid,
        "Accept": "text/event-stream",
      },
      body: JSON.stringify({
        ...Fixtures.requests.chat.valid,
        stream: true,
      }),
    });

    assertEquals(response.status, 200);
    assertEquals(response.headers.get("Content-Type"), "text/event-stream");

    // Collect streaming response
    const messages = await collectStreamingResponse(response);
    assertEquals(messages.length, Fixtures.responses.streaming.chunks.length);

    // Verify metering was recorded
    const calls = ctx.getMockFetchCalls();
    assertEquals(calls.length, 2);
    assertEquals(calls[1].url.includes("/v1/subscription_items"), true);
  });

  await t.step("rate limiting and retry", async () => {
    // Mock responses for rate limiting
    ctx.mockFetch([
      // Initial rate limit
      new Response(JSON.stringify(Fixtures.responses.error.rateLimit), { status: 429 }),
      // Retry success
      new Response(JSON.stringify(Fixtures.responses.success.chat), { status: 200 }),
      // Stripe metering
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    ]);

    const response = await fetch("http://localhost:8000/v1/chat/completions", {
      method: "POST",
      headers: Fixtures.headers.valid,
      body: JSON.stringify(Fixtures.requests.chat.valid),
    });

    assertEquals(response.status, 200);
    const data = await response.json();
    assertEquals(data.choices[0].message.content, "Hello! I'm doing well, thank you for asking. How are you?");

    // Verify retry occurred
    const calls = ctx.getMockFetchCalls();
    assertEquals(calls.length, 3);
  });

  // Cleanup
  cleanup();
  await ctx.cleanup();
});

/**
 * Helper to collect streaming response
 */
async function collectStreamingResponse(response: Response): Promise<unknown[]> {
  const reader = response.body?.getReader();
  assertExists(reader);

  const messages: unknown[] = [];
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split("\n");

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(5);
        if (data === "[DONE]") continue;
        messages.push(JSON.parse(data));
      }
    }
  }

  return messages;
}