const BASE = "https://api.neynar.com/v2";

export async function fetchCastByHash(hash: string) {
  const url = `${BASE}/farcaster/cast?identifier=${hash}&type=hash`;
  const res = await fetch(url, {
    headers: {
      api_key: process.env.NEYNAR_API_KEY!,
    },
  });
  if (!res.ok) {
    throw new Error(
      `Neynar cast fetch failed: ${res.status} ${res.statusText}`,
    );
  }
  const json = await res.json();
  return json.cast;
}
