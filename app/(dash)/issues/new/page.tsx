// /app/(dash)/issues/new/page.tsx
"use client";

import { useState } from "react";
import Editor from "@/components/wysiwyg/Editor";
import InlineAI from "@/components/wysiwyg/InlineAI";

export default function NewIssuePage() {
  const [summary, setSummary] = useState("");
  const [projectId, setProjectId] = useState<number>(0);
  const [description, setDescription] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, summary, description })
    });
    window.location.href = "/issues";
  }

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <form onSubmit={submit} className="md:col-span-2 bg-white border rounded p-4 space-y-3">
        <h1 className="text-lg font-semibold">New Issue</h1>
        <input className="border w-full p-2 rounded" placeholder="Summary" value={summary} onChange={e=>setSummary(e.target.value)} />
        <input className="border w-full p-2 rounded" placeholder="Project ID" type="number" value={projectId} onChange={e=>setProjectId(parseInt(e.target.value||"0",10))} />
        <Editor value={description} onChange={setDescription} />
        <button className="border rounded px-3 py-1">Create Issue</button>
      </form>
      <div className="space-y-3">
        <InlineAI onInsert={(text) => setDescription((d) => d + `\n\n<blockquote>${text}</blockquote>`)} />
      </div>
    </div>
  );
}
