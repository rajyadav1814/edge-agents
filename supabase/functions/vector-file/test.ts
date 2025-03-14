import { assertEquals } from "https://deno.land/std@0.215.0/assert/mod.ts";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";

// Load environment variables
await load({ export: true });

// Mock data
const testVectorStore = {
  id: "vs_test123",
  name: "test-store",
  created_at: new Date().toISOString()
};

const testFile = {
  id: "file-test123",
  filename: "test.txt",
  content: [{ text: "Test content" }]
};

// Test vector store operations
Deno.test("Vector store operations", async (t) => {
  await t.step("Create vector store", async () => {
    const response = await fetch("http://localhost:54321/functions/v1/vector-file/create-store", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({
        name: "test-store"
      })
    });

    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(typeof data.id, "string");
  });

  await t.step("Upload file", async () => {
    const file = new File(["Test content"], "test.txt", { type: "text/plain" });
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:54321/functions/v1/vector-file/upload-file", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: formData
    });

    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(typeof data.id, "string");
  });

  await t.step("Add file to store", async () => {
    const response = await fetch("http://localhost:54321/functions/v1/vector-file/add-file", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({
        vectorStoreId: testVectorStore.id,
        fileId: testFile.id,
        chunkingStrategy: {
          max_chunk_size_tokens: 1000,
          chunk_overlap_tokens: 200
        }
      })
    });

    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(data.success, true);
  });

  await t.step("Check status", async () => {
    const response = await fetch("http://localhost:54321/functions/v1/vector-file/check-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({
        vectorStoreId: testVectorStore.id
      })
    });

    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(Array.isArray(data.data), true);
  });

  await t.step("Search", async () => {
    const response = await fetch("http://localhost:54321/functions/v1/vector-file/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({
        vectorStoreId: testVectorStore.id,
        query: "test",
        maxResults: 5,
        webSearch: {
          enabled: true
        },
        hybridSearch: {
          enabled: true,
          vectorWeight: 0.7,
          keywordWeight: 0.3
        }
      })
    });

    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(Array.isArray(data.vector_results), true);
    assertEquals(Array.isArray(data.web_results), true);
    assertEquals(typeof data.status, "object");
  });

  await t.step("Chat", async () => {
    const response = await fetch("http://localhost:54321/functions/v1/vector-file/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({
        vectorStoreId: testVectorStore.id,
        messages: [
          {
            role: "user",
            content: "What is in the test file?"
          }
        ],
        maxResults: 5
      })
    });

    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(typeof data.message, "object");
    assertEquals(typeof data.context, "object");
  });

  await t.step("Query", async () => {
    const response = await fetch("http://localhost:54321/functions/v1/vector-file/query", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
      },
      body: JSON.stringify({
        vectorStoreId: testVectorStore.id,
        question: "What is in the test file?",
        maxResults: 5
      })
    });

    const data = await response.json();
    assertEquals(response.status, 200);
    assertEquals(typeof data.answer, "string");
    assertEquals(typeof data.context, "object");
  });
});