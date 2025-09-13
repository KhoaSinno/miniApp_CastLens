"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "./Button";
import TypingBubble from "./TypingBubble";

type Turn = { role: "user" | "assistant"; content: string };

export default function ChatbotPanel({ castHash }: { castHash: string }) {
  const [history, setHistory] = useState<Turn[]>([
    {
      role: "assistant",
      content:
        "Xin chào! Mình là Chatbot của CastLens. Bạn có thể hỏi mình về nội dung cast này (tóm tắt, giải thích thuật ngữ, phân tích ý chính, dịch một đoạn, v.v.).",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const castHashPattern = /^0x[a-fA-F0-9]{40}$/;

  useEffect(() => {
    // auto-scroll mỗi lần có message mới
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [history]);

  async function sendMessage() {
    if (sending) return;
    const prompt = input.trim();
    if (!prompt) return;

    if (!castHashPattern.test(castHash.trim())) {
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: "❗Cast hash không hợp lệ. Vui lòng kiểm tra lại.",
        },
      ]);
      return;
    }

    setSending(true);
    setHistory((h) => [...h, { role: "user", content: prompt }]);
    setInput("");

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          castHash: castHash.trim(),
          input: prompt,
          history,
        }),
      });

      if (!res.ok) {
        const raw = await res.text();
        console.error("Chatbot bad response:", res.status, raw);
        setHistory((h) => [
          ...h,
          {
            role: "assistant",
            content: `⚠️ Chatbot lỗi (${res.status}). Thử lại sau nhé.`,
          },
        ]);
        return;
      }

      const data = await res.json();
      const reply: string = data?.content || "Mình chưa nhận được gì từ model.";
      setHistory((h) => [...h, { role: "assistant", content: reply }]);
    } catch (err) {
      console.error("Chatbot error:", err);
      setHistory((h) => [
        ...h,
        {
          role: "assistant",
          content: "⚠️ Kết nối chatbot thất bại. Vui lòng thử lại.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      <div
        ref={scrollRef}
        className="h-[360px] overflow-y-auto p-3 rounded-lg border border-[var(--app-card-border)] bg-[var(--app-background)]"
      >
        {history.map((t, i) => (
          <div
            key={i}
            className={`mb-3 flex ${t.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] whitespace-pre-wrap leading-relaxed rounded-2xl px-3 py-2 text-sm ${
                t.role === "user"
                  ? "bg-[var(--app-accent)] text-white"
                  : "bg-[var(--app-gray)] text-[var(--app-foreground)]"
              }`}
            >
              {t.content}
            </div>
          </div>
        ))}

        {sending && <TypingBubble />}
      </div>

      <div className="mt-3 space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Hỏi bất cứ điều gì về cast này… (Ctrl/⌘ + Enter để gửi)"
          className="w-full min-h-[84px] p-3 rounded-lg border border-[var(--app-card-border)] bg-[var(--app-background)] text-[var(--app-foreground)] focus:ring-2 focus:ring-[var(--app-accent)] focus:border-transparent"
        />
        <div className="flex justify-end">
          <Button
            onClick={sendMessage}
            disabled={sending}
            className="btn-gradient text-white"
          >
            {sending ? "Responding…" : "Send"}
          </Button>
        </div>
      </div>
    </>
  );
}
