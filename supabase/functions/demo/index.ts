import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(() => {
  return new Response(`
    <html>
      <head>
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            font-family: sans-serif;
          }
          p {
            text-align: center;
            font-size: 1.2rem;
          }
        </style>
      </head>
      <body>
        <p>Welcome to Supabase Function calling from Local Docker</p>
      </body>
    </html>
  `, {
    headers: { "Content-Type": "text/html" },
  });
});