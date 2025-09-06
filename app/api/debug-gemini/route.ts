import { callGemini } from "@/lib/gemini";

export const runtime = "edge";

export async function GET() {
  try {
    console.log("Testing Gemini API...");
    console.log("GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    console.log(
      "GEMINI_API_KEY prefix:",
      process.env.GEMINI_API_KEY?.substring(0, 10),
    );

    // Simple test
    const result = await callGemini({
      mode: "translate",
      text: "Hello world",
      imageUrls: [],
      targetLang: "vi",
    });

    return Response.json({
      success: true,
      result,
      env: {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        keyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10),
      },
    });
  } catch (error) {
    console.error("Gemini test error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        env: {
          hasGeminiKey: !!process.env.GEMINI_API_KEY,
          keyPrefix: process.env.GEMINI_API_KEY?.substring(0, 10),
        },
      },
      { status: 500 },
    );
  }
}
