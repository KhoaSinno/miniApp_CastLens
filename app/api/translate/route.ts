import { NextRequest } from "next/server";
import { callGemini } from "@/lib/gemini";

export const runtime = "edge";

interface TranslateRequest {
  text: string;
  mode: "translate" | "explain";
  targetLang?: string;
}

export async function POST(req: NextRequest) {
  try {
    console.log("=== Translation API called ===");
    const body = await req.json();
    console.log("Request body:", body);

    const { text, mode, targetLang = "vi" }: TranslateRequest = body;

    if (!text?.trim()) {
      console.log("Error: Text is required");
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    console.log("Calling Gemini with:", {
      mode,
      text: text.trim(),
      targetLang,
    });
    console.log("Environment check:");
    console.log("- GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    console.log("- GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length);

    // Call Gemini AI
    const result = await callGemini({
      mode,
      text: text.trim(),
      imageUrls: [], // No images from MiniApp interface
      targetLang,
    });

    console.log("Gemini result:", result);
    return Response.json(result);
  } catch (error) {
    console.error("=== Translation API error ===");
    console.error("Error type:", error?.constructor?.name);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : error,
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );
    console.error("Full error object:", error);
    return Response.json(
      { error: "Translation failed. Please try again." },
      { status: 500 },
    );
  }
}
