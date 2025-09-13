"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import ChatbotPanel from "./ChatbotPanel";

interface TranslationResult {
  translated?: string;
  unchanged?: boolean;
  notes?: string[];
  error?: string;
}

interface ExplanationResult {
  summary?: string;
  eli5?: string;
  key_points?: string[];
  glossary?: Array<{ term: string; meaning: string }>;
  error?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_URL;

export function Translator() {
  const [castHash, setCastHash] = useState("");
  const [translateResult, setTranslateResult] =
    useState<TranslationResult | null>(null);
  const [explainResult, setExplainResult] = useState<ExplanationResult | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"translate" | "explain" | "chatbot">(
    "translate",
  );

  const handleTranslate = async () => {
    // Validate cast hash like - 0x671ea3b3a89c03af400a36d8470bf60cab482366
    const castHashPattern = /^0x[a-fA-F0-9]{40}$/;
    if (!castHashPattern.test(castHash.trim())) {
      setTranslateResult({ error: "Invalid cast hash format." });
      setExplainResult({ error: "Invalid cast hash format." });
      return;
    }

    // require castHash (you were checking inputText)
    if (!castHash.trim()) {
      setTranslateResult({ error: "Cast hash is required." });
      setExplainResult({ error: "Cast hash is required." });
      return;
    }

    setLoading(true);
    try {
      // Call /api/fetch-cast to get cast text
      const castResponse = await fetch(`${baseUrl}/api/fetch-cast`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ castHash: castHash.trim() }),
      });

      // Get raw text from response
      const rawText = await castResponse.text();

      // BAD RESPONSE
      if (!castResponse.ok) {
        console.error("Fetch cast failed:", castResponse.status, rawText);
        setTranslateResult({
          error: `Failed fetching cast: ${castResponse.status}`,
        });
        setExplainResult({
          error: `Failed fetching cast: ${castResponse.status}`,
        });
        return;
      }

      // try parse JSON fallback to rawText
      let dataRes;
      try {
        dataRes = JSON.parse(rawText);
      } catch {
        dataRes = { cast: rawText };
      }

      // console.log("Fetch cast response data:", dataRes.text);
      // Extract image URLs if any
      const imageUrls = [];
      if (
        dataRes?.embeds &&
        Array.isArray(dataRes.embeds) &&
        dataRes.embeds.length > 0
      ) {
        for (const embed of dataRes.embeds) {
          imageUrls.push(embed.url);
        }
      }
      // console.log("Extracted image URLs:", imageUrls);

      // Prepare text for translation/explanation
      // const geminiData =
      //   (dataRes.text += `\n You have to read this image to understand and reply to user, Link related: {
      // URL: ${dataRes?.embeds?.[0]?.url}
      // }`);

      // Call /api/translate with text and image URLs

      const response = await fetch(`${baseUrl}/api/translate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: dataRes?.text,
          imageUrls: imageUrls,
          mode,
          targetLang: "vi",
        }),
      });

      const data = await response.json();

      if (mode === "translate") setTranslateResult(data);
      else setExplainResult(data);
    } catch (error) {
      console.error("Translation error:", error);
      setTranslateResult({ error: "Translation failed" });
      setExplainResult({ error: "Translation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in translator-theme translator-hero">
      {/* Header */}
      <div className="flex items-center justify-center mb-4">
        <h2 className="text-xl font-bold">
          🌐 CastLens <span className="sparkle">Translator</span>
        </h2>
      </div>

      {/* Mode Selection Card */}
      <Card title="Fetch Cast from Farcaster">
        <div className="pb-3">
          <input
            type="text"
            value={castHash}
            onChange={(e) => setCastHash(e.target.value)}
            placeholder="0x1d225d4dd118b2ba6a688e8b181b9aa57a396aa7"
            className="w-full p-3 border border-[var(--app-card-border)] bg-[var(--app-background)] text-[var(--app-foreground)] rounded-lg focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent glow-outline"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={mode === "translate" ? "primary" : "outline"}
            onClick={() => setMode("translate")}
            className="w-full"
          >
            😍 Translate to VI
          </Button>
          <Button
            variant={mode === "explain" ? "primary" : "outline"}
            onClick={() => setMode("explain")}
            className="w-full"
          >
            🤩 Explain (ELI5)
          </Button>
        </div>
        <div className="mt-4">
          <Button
            variant={mode === "chatbot" ? "primary" : "outline"}
            onClick={() => setMode("chatbot")}
            className="w-full text-white"
          >
            💬 Chat with chatbot
          </Button>
        </div>
      </Card>

      {mode !== "chatbot" && (
        <Button
          onClick={handleTranslate}
          disabled={!castHash.trim() || loading}
          className="w-full btn-gradient"
        >
          {loading ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Processing...</span>
            </span>
          ) : mode === "translate" ? (
            "Translate"
          ) : (
            "Explain"
          )}
        </Button>
      )}

      {/* Result Card */}
      {((mode !== "chatbot" && (translateResult || explainResult)) ||
        mode === "chatbot") && (
        <Card title={mode === "chatbot" ? "💬 Chatbot" : "Translation Result"}>
          {mode === "chatbot" ? (
            <ChatbotPanel castHash={castHash} />
          ) : translateResult?.error || explainResult?.error ? (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg">
              <strong>Error:</strong>{" "}
              {translateResult?.error || explainResult?.error}
            </div>
          ) : mode === "translate" && translateResult ? (
            <div className="space-y-3">
              {translateResult.unchanged ? (
                <div className="text-[var(--app-foreground-muted)] italic bg-[var(--app-gray)] p-3 rounded-lg">
                  Text is already in Vietnamese or doesn&apos;t need
                  translation.
                </div>
              ) : (
                <div className="text-[var(--app-foreground)] bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                  {translateResult.translated}
                </div>
              )}
              {translateResult.notes && translateResult.notes!.length > 0 && (
                <div className="text-sm text-[var(--app-foreground-muted)] bg-[var(--app-gray)] p-3 rounded-lg">
                  <strong>Notes:</strong> {translateResult.notes!.join(", ")}
                </div>
              )}
            </div>
          ) : mode === "explain" && explainResult ? (
            <div className="space-y-4">
              {explainResult.summary && (
                <div className="bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                  <strong className="text-sm text-[var(--app-accent)]">
                    Summary:
                  </strong>
                  <p className="text-[var(--app-foreground)] mt-1">
                    {explainResult.summary}
                  </p>
                </div>
              )}

              {explainResult.eli5 && (
                <div className="bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                  <strong className="text-sm text-[var(--app-accent)]">
                    ELI5:
                  </strong>
                  <p className="text-[var(--app-foreground)] mt-1">
                    {explainResult.eli5}
                  </p>
                </div>
              )}

              {explainResult.key_points &&
                explainResult.key_points!.length > 0 && (
                  <div className="bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                    <strong className="text-sm text-[var(--app-accent)]">
                      Key Points:
                    </strong>
                    <ul className="list-disc list-inside text-[var(--app-foreground)] space-y-1 mt-1">
                      {explainResult.key_points!.map(
                        (point: string, idx: number) => (
                          <li key={idx}>{point}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {explainResult.glossary && explainResult.glossary!.length > 0 && (
                <div className="bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                  <strong className="text-sm text-[var(--app-accent)]">
                    Glossary:
                  </strong>
                  <div className="space-y-2 mt-1">
                    {explainResult.glossary!.map((item, idx: number) => (
                      <div key={idx} className="text-sm">
                        <strong className="text-[var(--app-foreground)]">
                          {item.term}:
                        </strong>{" "}
                        <span className="text-[var(--app-foreground-muted)]">
                          {item.meaning}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </Card>
      )}
    </div>
  );
}
