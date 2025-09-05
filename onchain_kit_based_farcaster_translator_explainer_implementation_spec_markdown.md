# OnchainKit‑based Farcaster **Translator + Explainer** Frame/Mini‑App — Implementation Spec

This spec instructs an agent to generate a production‑ready Next.js app using **OnchainKit** (Frames + MiniKit‑ready), **Neynar** (cast fetch), and **Gemini** (translation & explanation). Output is a Farcaster **Frame** that works in Warpcast (and is MiniKit‑friendly). The app translates or explains the **parent cast** (text + images) in‑place and returns an OG image with action buttons.

---

## 0) High‑Level Goals & UX

**Actions**

- **Translate to Vietnamese** (default, configurable target language)
- **Explain (ELI5)**: summary, key points, short glossary, examples

**Flow**

1. User taps **Open** on the Frame under a cast.
2. Frame payload contains `castId` and `inputText` (optional).
3. Server validates payload with OnchainKit’s `getFrameMessage` (Neynar key).
4. Server fetches the parent cast via Neynar (text + embeds).
5. Server calls Gemini 1.5 Flash (text + up to 3 images) with strict JSON prompts.
6. Frame returns an **OG image** showing result and buttons:
   - **Quote result** (`post_redirect` to Warpcast composer)
   - **Show original** (re‑render original or let user open the cast)

**Optional**: Input field allows follow‑up questions (Q&A mode handled like Explain).

---

## 1) Create Project (OnchainKit CLI)

```bash
npm create onchain@latest
# Suggested answers
# Project name: translator-mini
# Template: OnchainKit (Frames ready) — Next.js + App Router
# Typescript: Yes
# Package manager: npm (or pnpm/yarn)
```

> The CLI scaffolds a Next.js app with OnchainKit preconfigured for Frames. We will add server routes and libs below.

---

## 2) Install Dependencies

```bash
# Core (already included by CLI): next, react, typescript
npm i @coinbase/onchainkit

# LLM
npm i @google/generative-ai

# OG images for Frames
npm i @vercel/og

# Neynar (REST via fetch)
# (no extra SDK required; we’ll use native fetch)

# Optional cache
npm i @upstash/redis
```

---

## 3) Environment Variables

Create `.env.local` (and mirror on Vercel):

```
NEXT_PUBLIC_URL=https://<your-app>.vercel.app
NEYNAR_API_KEY=<your-neynar-key>
GEMINI_API_KEY=<your-gemini-key>
# Optional cache
UPSTASH_REDIS_REST_URL=<url>
UPSTASH_REDIS_REST_TOKEN=<token>
```

**Rules**: Do **not** expose Neynar/Gemini keys to the client. All calls server‑side only.

---

## 4) Project Structure

```
app/
  frame/route.ts                 # GET: initial Frame (HTML via OnchainKit helper)
  api/
    frame/
      assist/route.ts            # POST: Frame action handler (Translate/Explain)
    og/route.ts                  # GET: OG image (renders result)
    health/route.ts              # GET: health check
lib/
  neynar.ts                      # fetchCastByHash(), optional signature validation hook
  gemini.ts                      # callGemini(), urlToInlineImage()
  prompts.ts                     # strict JSON prompts (translate/explain)
  content.ts                     # extractAssets(), buildQuoteText(), contentHash()
  cache.ts                       # Upstash Redis helpers (optional)
  rate-limit.ts                  # simple token bucket (per fid + mode)
types/
  frame.ts                       # types for Frame payloads
public/
  cover.png                      # default OG image for first frame
```

---

## 5) Initial Frame Route (OnchainKit helper)

**File:** `app/frame/route.ts`

```ts
// app/frame/route.ts
import { getFrameHtmlResponse } from '@coinbase/onchainkit/frame';
export const runtime = 'edge';

export async function GET() {
  const html = getFrameHtmlResponse({
    buttons: [
      { label: 'Translate to Vietnamese' },
      { label: 'Explain (ELI5)' },
    ],
    image: `${process.env.NEXT_PUBLIC_URL}/cover.png`,
    postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame/assist`,
    input: { text: 'Paste text or ask a question (optional)' },
  });
  return new Response(html, { headers: { 'content-type': 'text/html' } });
}
```

> `getFrameHtmlResponse` outputs the correct HTML+meta (`fc:frame`) for Warpcast. Ensure `cover.png` is <2MB and publicly accessible.

---

## 6) Frame Action Handler (Verify, Fetch, LLM, Respond)

**File:** `app/api/frame/assist/route.ts`

```ts
import { NextRequest } from 'next/server';
import { getFrameMessage, type FrameRequest } from '@coinbase/onchainkit/frame';
import { fetchCastByHash } from '@/lib/neynar';
import { extractAssets, contentHash, buildQuoteText } from '@/lib/content';
import { callGemini } from '@/lib/gemini';
import { getCache, setCache } from '@/lib/cache';
import { rateLimit } from '@/lib/rate-limit';
import { getFrameHtmlResponse } from '@coinbase/onchainkit/frame';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = (await req.json()) as FrameRequest;
  const { isValid, message } = await getFrameMessage(body, {
    neynarApiKey: process.env.NEYNAR_API_KEY!,
  });
  if (!isValid) {
    return new Response('Invalid frame message', { status: 400 });
  }

  const mode = message.button === 2 ? 'explain' : 'translate';
  const targetLang = 'vi';
  const input = (message.inputText || '').trim();

  await rateLimit(`${message.fid}:${mode}`); // basic in-memory limit (replace with durable RL in prod)

  // 1) Gather content: priority inputText -> parent cast
  let text = input;
  let imageUrls: string[] = [];

  if (!text && message.castId?.hash) {
    const cast = await fetchCastByHash(message.castId.hash);
    const assets = extractAssets(cast);
    text = assets.text || text;
    imageUrls = assets.imageUrls;

    // If it’s a quote/reply and text is empty, try parent
    if (!text && (cast.parent_hash || cast.parentHash)) {
      const parentHash = cast.parent_hash || cast.parentHash;
      const parent = await fetchCastByHash(parentHash);
      const p = extractAssets(parent);
      text = p.text || text;
      if (imageUrls.length === 0) imageUrls = p.imageUrls;
    }
  }

  if (!text && imageUrls.length === 0) {
    const html = getFrameHtmlResponse({
      buttons: [ { label: 'Translate to Vietnamese' }, { label: 'Explain (ELI5)' } ],
      image: `${process.env.NEXT_PUBLIC_URL}/cover.png`,
      postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame/assist`,
      input: { text: 'Paste text or ask a question (optional)' },
    });
    return new Response(html, { headers: { 'content-type': 'text/html' } });
  }

  // 2) Cache key per content
  const key = contentHash({ mode, targetLang, text, imageUrls });
  const cached = await getCache(key);
  if (cached) return renderResult(cached, mode);

  // 3) LLM call
  const result = await callGemini({ mode, text, imageUrls, targetLang });
  await setCache(key, result, 60 * 60 * 24);

  return renderResult(result, mode);
}

function renderResult(result: any, mode: 'translate' | 'explain') {
  const payload = encodeURIComponent(JSON.stringify(result));
  const imageUrl = `${process.env.NEXT_PUBLIC_URL}/api/og?payload=${payload}`;
  const quoteText = buildQuoteText(result);
  const composer = `https://warpcast.com/~/compose?text=${encodeURIComponent(quoteText)}`;

  const html = getFrameHtmlResponse({
    image: imageUrl,
    postUrl: `${process.env.NEXT_PUBLIC_URL}/api/frame/assist`,
    buttons: [
      { label: 'Quote result', action: 'post_redirect', target: composer },
      { label: 'Show original' },
    ],
  });
  return new Response(html, { headers: { 'content-type': 'text/html' } });
}
```

---

## 7) OG Image Renderer (Result Card)

**File:** `app/api/og/route.ts`

```tsx
import { ImageResponse } from '@vercel/og';
export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('payload') || '{}';
  const data = JSON.parse(raw);
  const title = data?.summary || (data?.unchanged ? 'Original' : 'Translation');
  const body = data?.translated || data?.eli5 || '';

  return new ImageResponse(
    (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', padding: 48 }}>
        <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 16 }}>{title}</div>
        <div style={{ fontSize: 28, whiteSpace: 'pre-wrap' }}>{body}</div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

---

## 8) Neynar Helper

**File:** `lib/neynar.ts`

```ts
const BASE = 'https://api.neynar.com/v2';

export async function fetchCastByHash(hash: string) {
  const url = `${BASE}/farcaster/cast?identifier=${hash}&type=hash`;
  const res = await fetch(url, { headers: { api_key: process.env.NEYNAR_API_KEY! } });
  if (!res.ok) throw new Error('Neynar cast fetch failed');
  const json = await res.json();
  return json.cast;
}
```

---

## 9) Gemini Helper (Multimodal)

**File:** `lib/gemini.ts`

```ts
import { GoogleGenerativeAI } from '@google/generative-ai';
import { translatePrompt, explainPrompt } from './prompts';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function urlToInlineImage(url: string) {
  const r = await fetch(url);
  const buf = await r.arrayBuffer();
  const b64 = Buffer.from(buf).toString('base64');
  const mime = r.headers.get('content-type') || 'image/jpeg';
  return { inlineData: { data: b64, mimeType: mime } };
}

export async function callGemini({ mode, text, imageUrls, targetLang = 'vi' }:{
  mode: 'translate' | 'explain';
  text: string;
  imageUrls: string[];
  targetLang?: string;
}) {
  const systemInstruction = mode === 'translate' ? translatePrompt : explainPrompt;
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', systemInstruction });

  const imageParts = await Promise.all(imageUrls.slice(0, 3).map(urlToInlineImage));
  const parts = [ { text: JSON.stringify({ text, target_lang: targetLang, mode }) }, ...imageParts ];

  const resp = await model.generateContent({ contents: [{ role: 'user', parts }] });
  return JSON.parse(resp.response.text()); // strict JSON per prompts
}
```

---

## 10) Prompts (Strict JSON)

**File:** `lib/prompts.ts`

```ts
export const translatePrompt = `You are a high-precision translator for short social posts (Farcaster casts).
Goals: preserve meaning, tone, nuance.
STRICT RULES
1) Do NOT translate or alter: @handles, #hashtags, $cashtags, URLs, code blocks, emojis, EVM/TON addresses (0x..., EQ...), tx hashes, ENS.
2) Keep original punctuation, newlines, Markdown.
3) If the text is already in the target language OR the non-target words ≤ 5, return it unchanged and set "unchanged": true.
OUTPUT (strict JSON):
{
  "source_lang": "<iso639-1>",
  "target_lang": "<iso639-1>",
  "unchanged": false,
  "translated": "<string>",
  "notes": []
}`;

export const explainPrompt = `You are an explainer for short social posts (Farcaster casts).
Return STRICT JSON only.
GOALS
- Make the text easy to understand in <target_lang>.
- Keep original handles/hashtags/URLs/emojis and any code or addresses unchanged.
- If asked a question, answer directly and concisely.
OUTPUT SHAPE
{
  "source_lang":"<iso639-1>",
  "target_lang":"<iso639-1>",
  "summary":"<1-2 sentences>",
  "eli5":"<explain like I'm 15, 2-4 sentences>",
  "key_points":["...","..."],
  "glossary":[{"term":"<jargon>","meaning":"<plain explain>"}],
  "examples":["<short example or analogy>"],
  "suggested_reply":"<optional>",
  "limits":["<uncertainty or missing context>"]
}
RULES
- Never translate or alter @handles, #hashtags, $cashtags, URLs, code blocks, EVM/TON addresses, tx hashes, ENS.
- Keep newlines and basic Markdown.
- If there isn’t enough context, say so in "limits" and ask a clarifying question.`;
```

---

## 11) Content Utilities

**File:** `lib/content.ts`

```ts
import crypto from 'node:crypto';

export function extractAssets(cast: any) {
  const text: string = cast?.text ?? '';
  const embeds: any[] = Array.isArray(cast?.embeds) ? cast.embeds : [];
  const urls = embeds.map((e) => (typeof e === 'string' ? e : e?.url)).filter(Boolean);
  const imageUrls = urls.filter((u) => /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(u));
  const otherUrls = urls.filter((u) => !imageUrls.includes(u));
  return { text, imageUrls, otherUrls };
}

export function contentHash(obj: any) {
  return crypto.createHash('sha256').update(JSON.stringify(obj)).digest('hex');
}

export function buildQuoteText(result: any) {
  if (result?.translated) return result.translated.slice(0, 240);
  if (result?.summary) return `TL;DR: ${result.summary}`.slice(0, 240);
  return '';
}
```

---

## 12) Cache & Rate Limit (Optional)

**File:** `lib/cache.ts`

```ts
import { Redis } from '@upstash/redis';
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
  : null;

export async function getCache(k: string) { return redis ? redis.get(k) : null; }
export async function setCache(k: string, v: any, ttlSec = 86400) { if (redis) await redis.set(k, v, { ex: ttlSec }); }
```

**File:** `lib/rate-limit.ts`

```ts
const memory = new Map<string, { count: number; ts: number }>();
export async function rateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const item = memory.get(key) || { count: 0, ts: now };
  if (now - item.ts > windowMs) { item.count = 0; item.ts = now; }
  item.count += 1; memory.set(key, item);
  if (item.count > limit) throw new Error('Rate limit exceeded');
}
```

---

## 13) Types

**File:** `types/frame.ts`

```ts
export interface FramePostBody {
  untrustedData: {
    fid: number;
    castId?: { fid: number; hash: string };
    inputText?: string;
    buttonIndex?: number; // 1 translate, 2 explain
  };
  trustedData?: { messageBytes: string };
}
```

---

## 14) Health Check

**File:** `app/api/health/route.ts`

```ts
export const runtime = 'edge';
export function GET() { return Response.json({ ok: true, time: new Date().toISOString() }); }
```

---

## 15) Run, Test, Deploy

**Local**

```bash
npm run dev
# Open http://localhost:3000/frame and copy this URL into a Farcaster cast
```

**Expected**

- Casting `/frame` URL shows an **Open** button in Warpcast.
- Tapping **Open** shows two buttons + input.
- **Translate** returns an OG with translated text; **Explain** returns summary/ELI5.
- **Quote result** opens the composer with a short prefilled text.

**Deploy**

- Push repo → Vercel import → set env vars → deploy.
- Post the deployed `/frame` URL in a cast.

---

## 16) Notes & Limitations

- Video embeds are usually external links (YouTube/X/TikTok). For MVP, fetch OG title/description as extra context; do not attempt raw video analysis.
- Some image hosts block hotlinking. Server‑fetch and inline as base64 (already handled).
- Keep payload small; if JSON gets large, store it in cache and pass a short `id` to `/api/og`.
- This spec focuses on **Frame** UX; enabling a full **Mini‑App** with MiniKit is straightforward afterward (share providers, render a richer React UI using OnchainKit components).

---

## 17) Future Enhancements

- Multi‑language selection (EN/VI/ES/PT/JA/KO/ZH).
- Session memory (fid + castHash) for short follow‑ups.
- Bot worker: auto‑reply to non‑target language casts with a “Tap to translate” Frame.
- On‑chain attestations for community translations (Phase 2).

---

## 18) License

MIT.
