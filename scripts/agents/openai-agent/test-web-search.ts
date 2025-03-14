import OpenAI from "jsr:@openai/openai";

const apiKey = Deno.env.get("OPENAI_API_KEY");
if (!apiKey) {
  console.error("Error: OPENAI_API_KEY is required");
  Deno.exit(1);
}

const openai = new OpenAI({
  apiKey,
});

async function testWebSearch() {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-search-preview",
      messages: [{
        role: "user",
        content: "What are the latest trends in baking bread at home?"
      }],
      web_search_options: {
        search_context_size: "high",
        user_location: {
          type: "approximate",
          approximate: {
            country: "US",
            city: "San Francisco",
            region: "California"
          }
        }
      }
    });

    console.log("Response:", JSON.stringify(response, null, 2));
    
    if (response.choices[0]?.message?.annotations) {
      console.log("\nCited Sources:");
      response.choices[0].message.annotations.forEach((annotation: any) => {
        if (annotation.type === 'url_citation') {
          console.log(`- ${annotation.url_citation.title}`);
          console.log(`  ${annotation.url_citation.url}\n`);
        }
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

if (import.meta.main) {
  await testWebSearch();
}