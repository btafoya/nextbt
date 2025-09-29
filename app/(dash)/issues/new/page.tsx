// /app/(dash)/issues/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import Editor from "@/components/wysiwyg/Editor";
import InlineAI from "@/components/wysiwyg/InlineAI";

interface Project {
  id: number;
  name: string;
}

export default function NewIssuePage() {
  const [summary, setSummary] = useState("");
  const [projectId, setProjectId] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects")
      .then(res => res.json())
      .then(data => {
        setProjects(data);
        if (data.length > 0) setProjectId(data[0].id);
        setLoading(false);
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, summary, description })
    });
    window.location.href = "/issues";
  }

  if (loading) return <div>Loading projects...</div>;

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <form onSubmit={submit} className="md:col-span-2 bg-white border rounded p-4 space-y-3">
        <h1 className="text-lg font-semibold">New Issue</h1>
        <input className="border w-full p-2 rounded" placeholder="Summary" value={summary} onChange={e=>setSummary(e.target.value)} required />
        <select className="border w-full p-2 rounded" value={projectId} onChange={e=>setProjectId(parseInt(e.target.value,10))} required>
          <option value={0}>Select Project</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <Editor value={description} onChange={setDescription} />
        <button className="border rounded px-3 py-1 bg-blue-600 text-white hover:bg-blue-700">Create Issue</button>
      </form>
      <div className="space-y-3">
        <InlineAI onInsert={(text) => setDescription((d) => d + `\n\n<blockquote>${text}</blockquote>`)} />
      </div>
    </div>
  );
}
