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

// Helper function for multipart form data
async function handleMultipartUpload(request: Request): Promise<FormData> {
  const contentType = request.headers.get("content-type");
  if (!contentType?.includes("multipart/form-data")) {
    throw new Error("Content-Type must be multipart/form-data");
  }
  return await request.formData();
}

// Type definitions
interface SearchResult {
  type: string;
  content: string;
  annotations?: any[];
  score?: number;
  file_id?: string;
}

interface SearchResults {
  vector_results: SearchResult[];
  web_results: SearchResult[];
  chat_response?: any;
  answer?: string | null;
  status: {
    vector_store: boolean;
    web_search: boolean | string;
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    if (!path) {
      throw new Error("Path is required");
    }

    switch (path) {
      case "create-store": {
        const { name, expiresAfter } = await req.json();
        if (!name) {
          throw new Error("Store name is required");
        }

        const options: any = { name };
        if (expiresAfter) {
          options.expires_after = expiresAfter;
        }

        const vectorStore = await openai.vectorStores.create(options);
        return new Response(JSON.stringify({ id: vectorStore.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "upload-file": {
        const formData = await handleMultipartUpload(req);
        const file = formData.get("file");
        
        if (!file || !(file instanceof File)) {
          throw new Error("File is required");
        }

        const uploadedFile = await openai.files.create({
          file,
          purpose: "assistants",
        });

        return new Response(JSON.stringify({ id: uploadedFile.id }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "add-file": {
        const { vectorStoreId, fileId, chunkingStrategy } = await req.json();
        if (!vectorStoreId || !fileId) {
          throw new Error("Vector store ID and file ID are required");
        }

        const options: any = { file_id: fileId };
        if (chunkingStrategy) {
          options.chunking_strategy = chunkingStrategy;
        }

        await openai.vectorStores.files.create(vectorStoreId, options);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "check-status": {
        const { vectorStoreId } = await req.json();
        if (!vectorStoreId) {
          throw new Error("Vector store ID is required");
        }

        const result = await openai.vectorStores.files.list(vectorStoreId);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "search": {
        const { vectorStoreId, query, maxResults = 5, filters, hybridSearch, rankingOptions } = await req.json();
        if (!vectorStoreId || !query) {
          throw new Error("Vector store ID and query are required");
        }

        const searchOptions: any = { query, max_num_results: maxResults };
        if (filters) {
          searchOptions.filters = filters;
        }
        if (rankingOptions) {
          searchOptions.ranking_options = rankingOptions;
        }

        const searchResponse = await openai.vectorStores.search(vectorStoreId, searchOptions);

        if (hybridSearch?.enabled) {
          // Implement hybrid search logic here
          const keywordResults = await openai.vectorStores.search(vectorStoreId, {
            ...searchOptions,
            search_type: "keyword"
          });

          // Combine and weight results
          const combinedResults = mergeAndWeightResults(
            searchResponse.data,
            keywordResults.data,
            hybridSearch.vectorWeight || 0.7,
            hybridSearch.keywordWeight || 0.3
          );

          return new Response(JSON.stringify({ data: combinedResults }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify(searchResponse), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "chat": {
        const { vectorStoreId, messages, maxResults = 5, filters, webSearch } = await req.json();
        if (!vectorStoreId || !messages || !Array.isArray(messages)) {
          throw new Error("Vector store ID and messages array are required");
        }

        const results: SearchResults = {
          vector_results: [],
          web_results: [],
          chat_response: null,
          status: {
            vector_store: false,
            web_search: false
          }
        };

        // Vector store search
        try {
          const searchResponse = await openai.vectorStores.search(vectorStoreId, {
            query: messages[messages.length - 1].content,
            max_num_results: maxResults,
            filters
          });

          results.vector_results = searchResponse.data.map(result => ({
            type: 'vector',
            content: result.content[0]?.text || '',
            file_id: result.file_id,
            score: result.score
          }));
          results.status.vector_store = true;
        } catch (error) {
          console.error("Vector store search error:", error);
        }

        // Web search if enabled
        if (webSearch?.enabled) {
          try {
            const webResponse = await openai.chat.completions.create({
              model: "gpt-4o-search-preview",
              web_search_options: {
                search_context_size: webSearch.contextSize || "medium"
              },
              messages: [{
                role: "user",
                content: messages[messages.length - 1].content
              }]
            });

            if (webResponse.choices[0]?.message?.content) {
              results.web_results = [{
                type: 'web',
                content: webResponse.choices[0].message.content,
              annotations: webResponse.choices[0].message.annotations || []
              }];

              // Save web results to vector store
              const timestamp = new Date().toISOString();
            const content = `Web Search Results (${timestamp})\n\n${webResponse.choices[0].message.content}`;
            
            const file = new File(
                [content],
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

              results.status.web_search = "✨ Web search results saved to vector store! 🎉";
            }
          } catch (error) {
            console.error("Web search error:", error);
          }
        }

        // Generate chat response
        const context = [
          ...results.vector_results.map(r => r.content),
          ...results.web_results.map(r => r.content)
        ].join("\n\n");

        const chatResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that answers questions based on the provided context. Be concise and accurate."
            },
            ...messages,
            {
              role: "assistant",
              content: `Context:\n${context}`
            }
          ]
        });

        results.chat_response = chatResponse;

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      case "query": {
        const { vectorStoreId, question, maxResults = 5, filters, rankingOptions, webSearch } = await req.json();
        if (!vectorStoreId || !question) {
          throw new Error("Vector store ID and question are required");
        }

        const results: SearchResults = {
          vector_results: [],
          web_results: [],
          answer: null,
          status: {
            vector_store: false,
            web_search: false
          }
        };

        // Vector store search
        try {
          const searchOptions: any = {
            query: question,
            max_num_results: maxResults,
            filters
          };
          if (rankingOptions) {
            searchOptions.ranking_options = rankingOptions;
          }

          const searchResponse = await openai.vectorStores.search(vectorStoreId, searchOptions);
          results.vector_results = searchResponse.data.map(result => ({
            type: 'vector',
            content: result.content[0]?.text || '',
            file_id: result.file_id,
            score: result.score
          }));
          results.status.vector_store = true;
        } catch (error) {
          console.error("Vector store search error:", error);
        }

        // Web search if enabled
        if (webSearch?.enabled) {
          try {
            const webResponse = await openai.chat.completions.create({
              model: "gpt-4o-search-preview",
              web_search_options: {
                search_context_size: webSearch.contextSize || "medium"
              },
              messages: [{
                role: "user",
                content: question
              }]
            });

            if (webResponse.choices[0]?.message?.content) {
              results.web_results = [{
                type: 'web',
                content: webResponse.choices[0].message.content,
              annotations: webResponse.choices[0].message.annotations || []
              }];

              // Save web results to vector store
              const timestamp = new Date().toISOString();
            const content = `Web Search Results (${timestamp})\n\n${webResponse.choices[0].message.content}`;
            
            const file = new File(
                [content],
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

              results.status.web_search = "✨ Web search results saved to vector store! 🎉";
            }
          } catch (error) {
            console.error("Web search error:", error);
          }
        }

        // Generate answer
        const context = [
          ...results.vector_results.map(r => r.content),
          ...results.web_results.map(r => r.content)
        ].join("\n\n");

        const answerResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that answers questions based on the provided context. Be concise and accurate."
            },
            {
              role: "user",
              content: `Context:\n${context}\n\nQuestion: ${question}`
            }
          ]
        });

        results.answer = answerResponse.choices[0]?.message?.content || null;

        return new Response(JSON.stringify(results), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      default:
        throw new Error(`Unknown path: ${path}`);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper function to merge and weight search results
function mergeAndWeightResults(vectorResults: any[], keywordResults: any[], vectorWeight: number, keywordWeight: number) {
  const combinedResults = new Map();

  // Process vector results
  vectorResults.forEach(result => {
    combinedResults.set(result.file_id, {
      ...result,
      score: result.score * vectorWeight
    });
  });

  // Process keyword results
  keywordResults.forEach(result => {
    if (combinedResults.has(result.file_id)) {
      const existing = combinedResults.get(result.file_id);
      existing.score += result.score * keywordWeight;
    } else {
      combinedResults.set(result.file_id, {
        ...result,
        score: result.score * keywordWeight
      });
    }
  });

  // Convert to array and sort by score
  return Array.from(combinedResults.values())
    .sort((a, b) => b.score - a.score);
}