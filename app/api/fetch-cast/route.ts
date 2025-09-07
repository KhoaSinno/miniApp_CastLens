import { fetchCastByHash } from "@/lib/neynar";

export const runtime = "edge";

export async function POST(request: Request) {
  const { castHash } = await request.json();

  const res = await fetchCastByHash(castHash);

  console.log("Text:", res.text);
  console.log("Media:", res.embeds?.url);

  return new Response(JSON.stringify(res), {
    headers: { "Content-Type": "application/json" },
  });
}
