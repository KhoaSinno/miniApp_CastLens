import { fetchCastByHash } from "@/lib/neynar";

export const runtime = "edge";

export async function GET() {
  const castHash = "0x1d225d4dd118b2ba6a688e8b181b9aa57a396aa7";
  const res = await fetchCastByHash(castHash);

  console.log("Text:", res.text);
  console.log("Media:", res.embeds.url);

  return Response.json(res);
}
