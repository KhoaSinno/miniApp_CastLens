export const runtime = "edge";
import { ImageResponse } from "@vercel/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          padding: 64,
          backgroundColor: "#0f172a",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          🌐 CastLens
        </div>
        <div
          style={{
            fontSize: 36,
            color: "#64748b",
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Translator for Vietnamese
        </div>
        <div
          style={{
            fontSize: 24,
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          Translate & explain Farcaster casts
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
