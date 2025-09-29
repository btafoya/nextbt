// /components/wysiwyg/InlineAI.tsx
"use client";

import React, { useState } from "react";
import { chatOpenRouter } from "@/lib/ai/openrouter";

export default function InlineAI({ onInsert }: { onInsert: (text: string) => void }) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  async function ask() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const answer = await chatOpenRouter([
        { role: "system", content: "You assist with bug triage, rewriting text, and drafting concise notes." },
        { role: "user", content: prompt }
      ]);
      onInsert(answer);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border rounded-md p-2 space-y-2">
      <textarea
        className="w-full border rounded p-2 text-sm"
        rows={4}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Ask AI about this issue..."
      />
      <div className="flex items-center gap-2">
        <button onClick={ask} disabled={loading} className="px-3 py-1 border rounded">
          {loading ? "Thinking..." : "Ask AI"}
        </button>
      </div>
    </div>
  );
}
