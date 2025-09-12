export const runtime = "edge";

export async function GET() {
  const mockData = {
    castHash: "0x307327bb5b8179265907c1968d69ab98b86e15bc",
    input:
      "What is this post related to? Summarize in Vietnamese. Explain it like I'm five.",
    history: [
      { role: "user", content: "Hi!" },
      { role: "assistant", content: "Hello! How can I help you?" },
    ],
  };
  const base = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const data = await fetch(`${base}/api/chatbot`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(mockData),
  });
  const json = await data.json();
  return Response.json(json);
}
