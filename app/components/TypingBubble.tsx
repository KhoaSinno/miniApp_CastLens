"use client";

export default function TypingBubble() {
  return (
    <div
      className="max-w-[15%] whitespace-pre-wrap leading-relaxed rounded-2xl px-3 py-2 text-sm bg-[var(--app-accent)] text-white"
      aria-live="polite"
      aria-busy="true"
    >
      {/* <span className="sr-only">Đang nhập…</span> */}
      <div className="flex items-center gap-1">
        <span
          className="w-2 h-2 rounded-full bg-white/90 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-white/70 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-white/50 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}
