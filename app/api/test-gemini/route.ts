import { GoogleGenerativeAI } from "@google/generative-ai";
import { cleanJsonResponse } from "@/lib/json-utils";

export const runtime = "edge";

export async function GET() {
  try {
    console.log("=== Simple Gemini Test ===");

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        error: "GEMINI_API_KEY not found",
        env: process.env.GEMINI_API_KEY ? "exists" : "missing",
      });
    }

    console.log("API Key exists, length:", process.env.GEMINI_API_KEY.length);

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Translate this to Vietnamese and return ONLY a JSON object:
{
  "source_lang": "en",
  "target_lang": "vi", 
  "translated": "your translation here",
  "unchanged": false
}

Text: "Hello world"`;

    console.log("Sending request to Gemini with retry...");

    // Retry mechanism
    let result;
    for (let i = 0; i < 3; i++) {
      try {
        result = await model.generateContent(prompt);
        break; // Success, exit retry loop
      } catch (error) {
        const isRetryable =
          error instanceof Error &&
          (error.message.includes("overloaded") ||
            error.message.includes("503") ||
            error.message.includes("502") ||
            error.message.includes("429"));

        if (i === 2 || !isRetryable) {
          throw error; // Last attempt or non-retryable error
        }

        console.log(`Retry attempt ${i + 1}/3 after ${(i + 1) * 1000}ms...`);
        await new Promise((resolve) => setTimeout(resolve, (i + 1) * 1000));
      }
    }

    if (!result) {
      throw new Error("Failed to get response after retries");
    }

    const response = result.response;
    const text = response.text();

    console.log("Raw response:", text);

    // Clean the response to remove markdown formatting
    const cleanedText = cleanJsonResponse(text);
    console.log("Cleaned response:", cleanedText);

    // Try to parse JSON
    const parsed = JSON.parse(cleanedText);

    return Response.json({
      success: true,
      result: parsed,
      raw: text,
    });
  } catch (error) {
    console.error("Simple test error:", error);
    return Response.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        type: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
