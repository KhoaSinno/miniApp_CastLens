import { GoogleGenerativeAI } from "@google/generative-ai";
import { translatePrompt, explainPrompt } from "./prompts";
import { cleanJsonResponse } from "./json-utils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Retry utility function
async function retryWithDelay<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable =
        error instanceof Error &&
        (error.message.includes("overloaded") ||
          error.message.includes("503") ||
          error.message.includes("502") ||
          error.message.includes("429"));

      if (i === maxRetries - 1 || !isRetryable) {
        throw error;
      }

      console.log(`Retry attempt ${i + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
  throw new Error("Max retries exceeded");
}

export async function urlToInlineImage(url: string) {
  try {
    const r = await fetch(url);
    const buf = await r.arrayBuffer();

    // Convert ArrayBuffer to base64 without Buffer (Edge runtime compatible)
    const bytes = new Uint8Array(buf);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const b64 = btoa(binary);

    const mime = r.headers.get("content-type") || "image/jpeg";
    return { inlineData: { data: b64, mimeType: mime } };
  } catch (error) {
    console.error("Error processing image:", error);
    throw error;
  }
}

export async function callGemini({
  mode,
  text,
  imageUrls,
  targetLang = "vi",
}: {
  mode: "translate" | "explain";
  text: string;
  imageUrls: string[];
  targetLang?: string;
}) {
  try {
    console.log("=== CallGemini function started ===");
    console.log("Parameters:", { mode, text, imageUrls, targetLang });

    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Choose system instruction based on mode
    const systemInstruction =
      mode === "translate" ? translatePrompt : explainPrompt;

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
    });

    // Convert image URLs to inline images
    const imageParts = await Promise.all(
      imageUrls.slice(0, 3).map(urlToInlineImage),
    );

    // Combine text and image parts
    const parts = [
      { text: JSON.stringify({ text, target_lang: targetLang, mode }) },
      ...imageParts,
    ];

    // Call Gemini with retry logic
    const result = await retryWithDelay(
      async () => {
        const resp = await model.generateContent({
          contents: [{ role: "user", parts }],
        });
        return resp;
      },
      5,
      3000,
    );

    // Get raw text response
    const responseText = result.response.text();

    // Clean the response to remove markdown formatting
    const cleanedResponse = cleanJsonResponse(responseText);

    // Parse cleaned JSON
    const parsedResult = JSON.parse(cleanedResponse);

    return parsedResult;
  } catch (error) {
    console.error("=== CallGemini error ===");
    console.error("Error type:", error?.constructor?.name);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : error,
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack",
    );
    throw error;
  }
}
