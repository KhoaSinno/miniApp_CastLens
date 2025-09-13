"use client";

import { useMiniKit } from "@coinbase/onchainkit/minikit";
import { useEffect } from "react";
import { Translator } from "./components/Translator";

export default function App() {
  const { setFrameReady, isFrameReady } = useMiniKit();

  useEffect(() => {
    if (!isFrameReady) setFrameReady();
  }, [setFrameReady, isFrameReady]);

  return (
    <div className="flex flex-col min-h-screen font-sans text-[var(--app-foreground)] mini-app-theme from-[var(--app-background)] to-[var(--app-gray)]">
        <main className="flex-1">
          <Translator />
        </main>
      {/* <div className="w-full max-w-md mx-auto px-4 py-3">
      </div> */}
    </div>
  );
}
