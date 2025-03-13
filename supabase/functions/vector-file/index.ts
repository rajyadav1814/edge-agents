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

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { vectorStoreId, query, useWebSearch = false } = await req.json();

    if (!vectorStoreId || !query) {
      return new Response(
        JSON.stringify({ error: "Vector store ID and query are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let results: any = {
      vector_results: [],
      web_results: [],
      status: {
        vector_store: false,
        web_search: false
      }
    };

    // Search vector store
    try {
      const vectorResponse = await openai.vectorStores.search(vectorStoreId, {
        query
      });

      results.vector_results = vectorResponse.data.slice(0, 5).map(result => ({
        type: 'vector',
        url: result.file_id,
        title: result.filename,
        content: result.content[0]?.text || ''
      }));
      results.status.vector_store = true;
    } catch (error) {
      console.error("Vector store search error:", error);
      results.status.vector_store = false;
    }

    // Perform web search if enabled
    if (useWebSearch) {
      try {
        const webResponse = await openai.chat.completions.create({
          model: "gpt-4o-search-preview",
          web_search_options: {
            search_context_size: "medium"
          },
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

          // Save web search results to vector store
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

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});