import { chatting } from "@/lib/gemini";

interface ChatRequest {
  castHash: string;
  input: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

// interface resultType {
//   content: string;
// }

export async function POST(req: Request) {
  const { castHash, input, history }: ChatRequest = await req.json();

  // Validation
  const castHashPattern = /^0x[a-fA-F0-9]{40}$/;
  const normalizedCastHash = castHash.trim();
  if (!normalizedCastHash || !castHashPattern.test(normalizedCastHash)) {
    return new Response("Invalid castHash", { status: 400 });
  }

  if (!input || !input.trim()) {
    return new Response("Input text is required", { status: 400 });
  }

  // Fetch cast data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const castResponse = await fetch(`${baseUrl}/api/fetch-cast`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ castHash: castHash.trim() }),
  });

  if (!castResponse.ok) {
    return new Response("Failed to fetch cast data", { status: 500 });
  }

  const castData = await castResponse.json();
  // console.log("Fetched Cast Data:", castData);

  // Validate image URLs for LLM
  const imageUrls = [];
  if (
    castData?.embeds &&
    Array.isArray(castData.embeds) &&
    castData.embeds.length > 0
  ) {
    for (const embed of castData.embeds) {
      imageUrls.push(embed.url);
    }
  }

  const data = await chatting({
    text: input,
    imageUrls,
    history: history ?? [],
    targetLang: "vi",
  });

  return new Response(JSON.stringify({ content: data.content }), {
    status: 200,
  });
}
