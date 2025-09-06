// app/frame/route.ts
export const runtime = "edge";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CastLens Translator</title>
    
    <!-- Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${baseUrl}/api/cover" />
    <meta property="fc:frame:post_url" content="${baseUrl}/api/frame/assist" />
    <meta property="fc:frame:input:text" content="Ask a question…" />
    <meta property="fc:frame:button:1" content="Translate to VI" />
    <meta property="fc:frame:button:2" content="Explain (ELI5)" />
    
    <!-- Open Graph -->
    <meta property="og:title" content="CastLens Translator" />
    <meta property="og:description" content="Translate and explain Farcaster casts for Vietnamese users" />
    <meta property="og:image" content="${baseUrl}/api/cover" />
  </head>
  <body>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif;">
      <h1>CastLens Translator</h1>
      <p>This is a Farcaster Frame. Open it in Warpcast to use the translator.</p>
    </div>
  </body>
</html>
  `.trim();

  return new Response(html, {
    headers: {
      "content-type": "text/html",
      "cache-control": "max-age=60",
    },
  });
}
