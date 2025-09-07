"use client";

import { useState } from "react";
import { Button } from "./DemoComponents";

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

type Result = TranslationResult | ExplanationResult | null;

// Card component matching DemoComponents style
function Card({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-[var(--app-card-bg)] backdrop-blur-md rounded-xl shadow-lg border border-[var(--app-card-border)] overflow-hidden transition-all hover:shadow-xl ${className}`}
    >
      {title && (
        <div className="px-5 py-3 border-b border-[var(--app-card-border)]">
          <h3 className="text-lg font-medium text-[var(--app-foreground)]">
            {title}
          </h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}

export function Translator() {
  const [castHash, setCastHash] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"translate" | "explain">("translate");

  const handleTranslate = async () => {
    // require castHash (you were checking inputText)
    if (!castHash.trim()) return;

    setLoading(true);
    try {
      const castResponse = await fetch("/api/fetch-cast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ castHash: castHash.trim() }),
      });

      const rawText = await castResponse.text();

      // BAD RESPONSE
      if (!castResponse.ok) {
        console.error("Fetch cast failed:", castResponse.status, rawText);
        setResult({ error: `Failed fetching cast: ${castResponse.status}` });
        return;
      }

      // try parse JSON fallback to rawText
      let dataRes;
      try {
        dataRes = JSON.parse(rawText);
      } catch {
        dataRes = { cast: rawText };
      }

      console.log("Fetch cast response data:", dataRes.text);

      const fetchedCast = dataRes?.cast ?? JSON.stringify(dataRes);

      console.log("Fetched Cast:", fetchedCast.text);

      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: dataRes.text,
          mode,
          targetLang: "vi",
        }),
      });

      console.log("Translation API response status:", response);

      const data = await response.json();
      setResult(data);

      // optional: call /api/translate here with fetchedCast...
    } catch (error) {
      console.error("Translation error:", error);
      setResult({ error: "Translation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-center mb-4">
        <h2 className="text-xl font-bold text-[var(--app-foreground)]">
          🌐 CastLens Translator
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
            className="w-full p-3 border border-[var(--app-card-border)] bg-[var(--app-background)] text-[var(--app-foreground)] rounded-lg focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
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
      </Card>

      {/* Input Card */}
      <Card
        title={mode === "translate" ? "Text to Translate" : "Text to Explain"}
      >
        <div className="space-y-4">
          {/* <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "translate"
                ? "Enter text to translate to Vietnamese..."
                : "Enter text to explain in simple terms..."
            }
            className="w-full p-3 border border-[var(--app-card-border)] bg-[var(--app-background)] text-[var(--app-foreground)] rounded-lg resize-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
            rows={4}
          /> */}

          <Button
            onClick={handleTranslate}
            // disabled={!inputText.trim() || loading}
            className="w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </span>
            ) : mode === "translate" ? (
              "🔄 Translate"
            ) : (
              "🤖 Explain"
            )}
          </Button>
        </div>
      </Card>

      {/* Result Card */}
      {result && (
        <Card
          title={
            mode === "translate" ? "Translation Result" : "Explanation Result"
          }
        >
          {result.error ? (
            <div className="text-red-600 bg-red-50 p-3 rounded-lg">
              <strong>Error:</strong> {result.error}
            </div>
          ) : mode === "translate" ? (
            <div className="space-y-3">
              {(result as TranslationResult).unchanged ? (
                <div className="text-[var(--app-foreground-muted)] italic bg-[var(--app-gray)] p-3 rounded-lg">
                  Text is already in Vietnamese or doesn&apos;t need
                  translation.
                </div>
              ) : (
                <div className="text-[var(--app-foreground)] bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                  {(result as TranslationResult).translated}
                </div>
              )}
              {(result as TranslationResult).notes?.length &&
                (result as TranslationResult).notes!.length > 0 && (
                  <div className="text-sm text-[var(--app-foreground-muted)] bg-[var(--app-gray)] p-3 rounded-lg">
                    <strong>Notes:</strong>{" "}
                    {(result as TranslationResult).notes!.join(", ")}
                  </div>
                )}
            </div>
          ) : (
            <div className="space-y-4">
              {(result as ExplanationResult).summary && (
                <div className="bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                  <strong className="text-sm text-[var(--app-accent)]">
                    Summary:
                  </strong>
                  <p className="text-[var(--app-foreground)] mt-1">
                    {(result as ExplanationResult).summary}
                  </p>
                </div>
              )}

              {(result as ExplanationResult).eli5 && (
                <div className="bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                  <strong className="text-sm text-[var(--app-accent)]">
                    ELI5:
                  </strong>
                  <p className="text-[var(--app-foreground)] mt-1">
                    {(result as ExplanationResult).eli5}
                  </p>
                </div>
              )}

              {(result as ExplanationResult).key_points?.length &&
                (result as ExplanationResult).key_points!.length > 0 && (
                  <div className="bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                    <strong className="text-sm text-[var(--app-accent)]">
                      Key Points:
                    </strong>
                    <ul className="list-disc list-inside text-[var(--app-foreground)] space-y-1 mt-1">
                      {(result as ExplanationResult).key_points!.map(
                        (point: string, idx: number) => (
                          <li key={idx}>{point}</li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {(result as ExplanationResult).glossary?.length &&
                (result as ExplanationResult).glossary!.length > 0 && (
                  <div className="bg-[var(--app-background)] p-3 rounded-lg border border-[var(--app-card-border)]">
                    <strong className="text-sm text-[var(--app-accent)]">
                      Glossary:
                    </strong>
                    <div className="space-y-2 mt-1">
                      {(result as ExplanationResult).glossary!.map(
                        (item, idx: number) => (
                          <div key={idx} className="text-sm">
                            <strong className="text-[var(--app-foreground)]">
                              {item.term}:
                            </strong>{" "}
                            <span className="text-[var(--app-foreground-muted)]">
                              {item.meaning}
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
