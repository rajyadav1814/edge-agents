import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { load } from "https://deno.land/std@0.215.0/dotenv/mod.ts";
import OpenAI from "jsr:@openai/openai";

// Load environment variables from .env file
const env = await load({ export: true });
const apiKey = Deno.env.get("OPENAI_API_KEY");

if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is required in .env file");
  Deno.exit(1);
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey,
});

// Helper function to validate and process request
async function processRequest(req: Request): Promise<{ endpoint: string; body: any }> {
  if (req.method === 'OPTIONS') {
    throw new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const endpoint = url.pathname.split('/').pop() || '';
  const body = await req.json();

  return { endpoint, body };
}

// Helper function to handle errors
function handleError(error: any) {
  console.error("Error:", error);
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

serve(async (req) => {
  try {
    const { endpoint, body } = await processRequest(req);

    let response: Response;
    switch (endpoint) {
      case 'create-store':
        response = await createStore(body);
        break;
      case 'upload-file':
        response = await uploadFile(body);
        break;
      case 'add-file':
        response = await addFileToStore(body);
        break;
      case 'check-status':
        response = await checkStatus(body);
        break;
      case 'search':
        response = await search(body);
        break;
      case 'chat':
        response = await chat(body);
        break;
      case 'query':
        response = await query(body);
        break;
      default:
        response = new Response(
          JSON.stringify({ error: "Invalid endpoint" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
    return response;
  } catch (error) {
    if (error instanceof Response) return error;
    return handleError(error);
  }
});

// Create vector store
async function createStore({ name, expiresAfter }: any) {
  const vectorStore = await openai.vectorStores.create({
    name,
    expires_after: expiresAfter
  });

  return new Response(
    JSON.stringify({ id: vectorStore.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Upload file
async function uploadFile({ file }: any) {
  const uploadedFile = await openai.files.create({
    file,
    purpose: "assistants"
  });

  return new Response(
    JSON.stringify({ id: uploadedFile.id }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Add file to vector store
async function addFileToStore({ vectorStoreId, fileId, chunkingStrategy }: any) {
  await openai.vectorStores.files.create(vectorStoreId, {
    file_id: fileId,
    chunking_strategy: chunkingStrategy
  });

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Check processing status
async function checkStatus({ vectorStoreId }: any) {
  const result = await openai.vectorStores.files.list(vectorStoreId);

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Search
async function search({ vectorStoreId, query, maxResults = 5, filters, webSearch, hybridSearch }: any) {
  const results = {
    vector_results: [] as any[],
    web_results: [] as any[],
    status: {
      vector_store: false,
      web_search: false,
      hybrid_search: false
    }
  };

  // Vector store search
  try {
    const searchParams: any = {
      query,
      filters
    };
    if (maxResults) searchParams.max_results = maxResults;

    const vectorResponse = await openai.vectorStores.search(vectorStoreId, searchParams);

    results.vector_results = vectorResponse.data.map(result => ({
      type: 'vector',
      url: result.file_id,
      title: result.filename,
      content: result.content[0]?.text || '',
      score: result.score
    }));
    results.status.vector_store = true;
  } catch (error) {
    console.error("Vector store search error:", error);
    results.status.vector_store = false;
  }

  // Web search
  if (webSearch?.enabled) {
    try {
      const webResponse = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{
          role: "user",
          content: query
        }]
      });

      if (webResponse.choices[0]?.message?.content) {
        results.web_results = [{
          type: 'web',
          content: webResponse.choices[0].message.content,
          annotations: webResponse.choices[0].message.annotations || []
        }];

        // Save web results to vector store
        const file = new File(
          [webResponse.choices[0].message.content],
          `web-search-${Date.now()}.txt`,
          { type: 'text/plain' }
        );

        const uploadedFile = await openai.files.create({
          file,
          purpose: "assistants"
        });

        await openai.vectorStores.files.create(vectorStoreId, {
          file_id: uploadedFile.id
        });

        results.status.web_search = true;
      }
    } catch (error) {
      console.error("Web search error:", error);
      results.status.web_search = false;
    }
  }

  // Hybrid search
  if (hybridSearch?.enabled) {
    try {
      const keywordSearchParams: any = {
        query,
        filters,
        search_type: "keyword"
      };
      if (maxResults) keywordSearchParams.max_results = maxResults;

      const keywordResults = await openai.vectorStores.search(vectorStoreId, keywordSearchParams);

      const hybridResults = results.vector_results.map(result => ({
        ...result,
        score: (result.score || 0) * hybridSearch.vectorWeight +
               (keywordResults.data.find(kr => kr.file_id === result.url)?.score || 0) * hybridSearch.keywordWeight
      }));

      results.vector_results = hybridResults.sort((a, b) => (b.score || 0) - (a.score || 0));
      results.status.hybrid_search = true;
    } catch (error) {
      console.error("Hybrid search error:", error);
      results.status.hybrid_search = false;
    }
  }

  return new Response(
    JSON.stringify(results),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Chat
async function chat({ vectorStoreId, messages, maxResults = 5, filters, webSearch }: any) {
  const context = [
    ...searchResults.vector_results.map((r: any) => r.content),
    ...searchResults.web_results.map((r: any) => r.content)
  ].join('\n\n');

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `Use this context to inform your responses:\n\n${context}`
      },
      ...messages
    ]
  });

  return new Response(
    JSON.stringify({
      message: response.choices[0].message,
      context: {
        vector_results: searchResults.vector_results,
        web_results: searchResults.web_results
      }
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Query
async function query({ vectorStoreId, question, maxResults = 5, filters, rankingOptions, webSearch }: any) {
  const searchResponse = await search({ vectorStoreId, query: question, maxResults, filters, webSearch });
  const searchResults = await searchResponse.json();
  
  const context = [
    ...searchResults.vector_results.map((r: any) => r.content),
    ...searchResults.web_results.map((r: any) => r.content)
  ].join('\n\n');

  const response = await openai.chat.completions.create({
    model: "gpt-4-turbo-preview",
    messages: [
      {
        role: "system",
        content: `Use this context to answer the question. Be concise and direct:\n\n${context}`
      },
      {
        role: "user",
        content: question
      }
    ]
  });

  return new Response(
    JSON.stringify({
      answer: response.choices[0].message.content,
      context: {
        vector_results: searchResults.vector_results,
        web_results: searchResults.web_results
      }
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}