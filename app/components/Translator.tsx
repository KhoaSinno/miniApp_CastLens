import { useState } from "react";

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

interface TranslatorProps {
  onBack: () => void;
}

export function Translator({ onBack }: TranslatorProps) {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<Result>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"translate" | "explain">("translate");

  const handleTranslate = async () => {
    if (!inputText.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          mode,
          targetLang: "vi",
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Translation error:", error);
      setResult({ error: "Translation failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">🌐 CastLens Translator</h2>
        <button
          onClick={onBack}
          className="text-[var(--app-accent)] hover:underline"
        >
          ← Back
        </button>
      </div>

      <div className="space-y-3">
        {/* Mode Selection */}
        <div className="flex space-x-2">
          <button
            onClick={() => setMode("translate")}
            className={`px-4 py-2 rounded-lg flex-1 text-sm font-medium transition-colors ${
              mode === "translate"
                ? "bg-[var(--app-accent)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            😍 Translate to VI
          </button>
          <button
            onClick={() => setMode("explain")}
            className={`px-4 py-2 rounded-lg flex-1 text-sm font-medium transition-colors ${
              mode === "explain"
                ? "bg-[var(--app-accent)] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            🤩 Explain (ELI5)
          </button>
        </div>

        {/* Input */}
        <div>
          <label className="block text-sm font-medium mb-2">
            {mode === "translate" ? "Text to translate:" : "Text to explain:"}
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              mode === "translate"
                ? "Enter text to translate to Vietnamese..."
                : "Enter text to explain in simple terms..."
            }
            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
            rows={4}
          />
        </div>

        {/* Action Button */}
        <button
          onClick={handleTranslate}
          disabled={!inputText.trim() || loading}
          className="w-full bg-[var(--app-accent)] text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-opacity-90 transition-colors"
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
        </button>

        {/* Result */}
        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">
              {mode === "translate" ? "Translation:" : "Explanation:"}
            </h3>

            {result.error ? (
              <p className="text-red-600">{result.error}</p>
            ) : mode === "translate" ? (
              <div className="space-y-2">
                {(result as TranslationResult).unchanged ? (
                  <p className="text-gray-600 italic">
                    Text is already in Vietnamese or doesn&apos;t need
                    translation.
                  </p>
                ) : (
                  <p className="text-gray-800">
                    {(result as TranslationResult).translated}
                  </p>
                )}
                {(result as TranslationResult).notes?.length &&
                  (result as TranslationResult).notes!.length > 0 && (
                    <div className="text-sm text-gray-600">
                      <strong>Notes:</strong>{" "}
                      {(result as TranslationResult).notes!.join(", ")}
                    </div>
                  )}
              </div>
            ) : (
              <div className="space-y-3">
                {(result as ExplanationResult).summary && (
                  <div>
                    <strong className="text-sm">Summary:</strong>
                    <p className="text-gray-800">
                      {(result as ExplanationResult).summary}
                    </p>
                  </div>
                )}

                {(result as ExplanationResult).eli5 && (
                  <div>
                    <strong className="text-sm">ELI5:</strong>
                    <p className="text-gray-800">
                      {(result as ExplanationResult).eli5}
                    </p>
                  </div>
                )}

                {(result as ExplanationResult).key_points?.length &&
                  (result as ExplanationResult).key_points!.length > 0 && (
                    <div>
                      <strong className="text-sm">Key Points:</strong>
                      <ul className="list-disc list-inside text-gray-800 space-y-1">
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
                    <div>
                      <strong className="text-sm">Glossary:</strong>
                      <div className="space-y-1">
                        {(result as ExplanationResult).glossary!.map(
                          (item, idx: number) => (
                            <div key={idx} className="text-sm">
                              <strong>{item.term}:</strong> {item.meaning}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
