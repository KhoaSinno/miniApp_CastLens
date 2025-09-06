interface CastEmbed {
  url?: string;
}

interface Cast {
  text?: string;
  embeds?: CastEmbed[] | string[];
}

interface LLMResult {
  translated?: string;
  summary?: string;
}

export function extractAssets(cast: Cast) {
  const text: string = cast?.text ?? "";
  const embeds: (CastEmbed | string)[] = Array.isArray(cast?.embeds)
    ? cast.embeds
    : [];
  const urls = embeds
    .map((e) => (typeof e === "string" ? e : e?.url))
    .filter(Boolean) as string[];
  const imageUrls = urls.filter((u) =>
    /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(u),
  );
  const otherUrls = urls.filter((u) => !imageUrls.includes(u));
  return { text, imageUrls, otherUrls };
}

export async function contentHash(obj: Record<string, unknown>) {
  const data = JSON.stringify(obj);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function buildQuoteText(result: LLMResult) {
  if (result?.translated) return result.translated.slice(0, 240);
  if (result?.summary) return `TL;DR: ${result.summary}`.slice(0, 240);
  return "";
}
