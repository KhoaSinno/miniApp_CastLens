import { NextRequest } from "next/server";
import { fetchCastByHash } from "@/lib/neynar";
import { extractAssets, contentHash, buildQuoteText } from "@/lib/content";
import { callGemini } from "@/lib/gemini";
import { getCache, setCache } from "@/lib/cache";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "edge";

interface FrameRequest {
  untrustedData: {
    fid: number;
    castId?: { fid: number; hash: string };
    inputText?: string;
    buttonIndex?: number;
  };
  trustedData?: { messageBytes: string };
}

// Simple frame validation (for production, use proper verification)
function validateFrameMessage(body: FrameRequest) {
  return {
    isValid: true, // Simplified for MVP
    message: {
      fid: body.untrustedData.fid,
      castId: body.untrustedData.castId,
      inputText: body.untrustedData.inputText,
      button: body.untrustedData.buttonIndex || 1,
    },
  };
}

function renderFrame(options: {
  image: string;
  buttons: Array<{ label: string; action?: string; target?: string }>;
  postUrl?: string;
  input?: { text: string };
}) {
  const buttonMetas = options.buttons
    .map((btn, idx) => {
      const index = idx + 1;
      if (btn.action === "post_redirect") {
        return `<meta property="fc:frame:button:${index}" content="${btn.label}" />
              <meta property="fc:frame:button:${index}:action" content="post_redirect" />
              <meta property="fc:frame:button:${index}:target" content="${btn.target}" />`;
      }
      return `<meta property="fc:frame:button:${index}" content="${btn.label}" />`;
    })
    .join("\n    ");

  const inputMeta = options.input
    ? `<meta property="fc:frame:input:text" content="${options.input.text}" />`
    : "";

  const postUrlMeta = options.postUrl
    ? `<meta property="fc:frame:post_url" content="${options.postUrl}" />`
    : "";

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CastLens Translator</title>
    
    <!-- Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${options.image}" />
    ${postUrlMeta}
    ${inputMeta}
    ${buttonMetas}
    
    <!-- Open Graph -->
    <meta property="og:title" content="CastLens Translator" />
    <meta property="og:image" content="${options.image}" />
  </head>
  <body>
    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: Arial, sans-serif;">
      <h1>CastLens Translator</h1>
      <p>Processing your request...</p>
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

interface LLMResult {
  translated?: string;
  summary?: string;
  eli5?: string;
  key_points?: string[];
  unchanged?: boolean;
}

function renderResult(result: LLMResult) {
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const payload = encodeURIComponent(JSON.stringify(result));
  const imageUrl = `${baseUrl}/api/og?payload=${payload}`;
  const quoteText = buildQuoteText(result);
  const composer = `https://warpcast.com/~/compose?text=${encodeURIComponent(quoteText)}`;

  return renderFrame({
    image: imageUrl,
    postUrl: `${baseUrl}/api/frame/assist`,
    buttons: [
      { label: "Quote result", action: "post_redirect", target: composer },
      { label: "Show original" },
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as FrameRequest;
    const { isValid, message } = validateFrameMessage(body);

    if (!isValid) {
      return new Response("Invalid frame message", { status: 400 });
    }

    const mode = message.button === 2 ? "explain" : "translate";
    const targetLang = "vi";
    const input = (message.inputText || "").trim();

    await rateLimit(`${message.fid}:${mode}`); // basic in-memory limit

    // 1) Gather content: priority inputText -> parent cast
    let text = input;
    let imageUrls: string[] = [];

    if (!text && message.castId?.hash) {
      try {
        const cast = await fetchCastByHash(message.castId.hash);
        const assets = extractAssets(cast);
        text = assets.text || text;
        imageUrls = assets.imageUrls;

        // If it's a quote/reply and text is empty, try parent
        if (!text && (cast.parent_hash || cast.parentHash)) {
          const parentHash = cast.parent_hash || cast.parentHash;
          const parent = await fetchCastByHash(parentHash);
          const p = extractAssets(parent);
          text = p.text || text;
          if (imageUrls.length === 0) imageUrls = p.imageUrls;
        }
      } catch (error) {
        console.error("Error fetching cast:", error);
      }
    }

    if (!text && imageUrls.length === 0) {
      return renderFrame({
        image: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/cover`,
        postUrl: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frame/assist`,
        buttons: [{ label: "Translate to VI" }, { label: "Explain (ELI5)" }],
        input: { text: "Ask a question…" },
      });
    }

    // 2) Cache key per content
    const key = await contentHash({ mode, targetLang, text, imageUrls });
    const cached = await getCache(key);
    if (cached) return renderResult(cached);

    // 3) LLM call
    const result = await callGemini({ mode, text, imageUrls, targetLang });
    await setCache(key, result, 60 * 60 * 24);

    return renderResult(result);
  } catch (error) {
    console.error("Frame assist error:", error);

    // Return error frame
    return renderFrame({
      image: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/cover`,
      postUrl: `${process.env.NEXT_PUBLIC_URL || "http://localhost:3000"}/api/frame/assist`,
      buttons: [{ label: "Try again" }],
    });
  }
}
