// /app/(dash)/issues/[id]/edit/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Editor from "@/components/wysiwyg/Editor";
import {
  getAllStatuses,
  getAllPriorities,
  getAllSeverities,
  getAllReproducibilities,
} from "@/lib/mantis-enums";

interface Project {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  realname: string;
}

interface Issue {
  id: number;
  project_id: number;
  summary: string;
  status: number;
  priority: number;
  severity: number;
  reproducibility: number;
  handler_id: number;
  text?: {
    description: string;
  };
}

export default function EditIssuePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const issueId = parseInt(params.id, 10);

  const [summary, setSummary] = useState("");
  const [projectId, setProjectId] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(10);
  const [priority, setPriority] = useState(30);
  const [severity, setSeverity] = useState(50);
  const [reproducibility, setReproducibility] = useState(10);
  const [handlerId, setHandlerId] = useState(0);
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/issues/${issueId}`, { cache: 'no-store' }).then(res => res.json()),
      fetch("/api/projects", { cache: 'no-store' }).then(res => res.json()),
      fetch("/api/users/assignable", { cache: 'no-store' }).then(res => res.json()),
    ]).then(([issueData, projectsData, usersData]) => {
      if (issueData.error) {
        setError(issueData.error);
        setLoading(false);
        return;
      }

      const issue: Issue = issueData;
      setSummary(issue.summary);
      setProjectId(issue.project_id);
      setDescription(issue.text?.description || "");
      setStatus(issue.status);
      setPriority(issue.priority);
      setSeverity(issue.severity);
      setReproducibility(issue.reproducibility);
      setHandlerId(issue.handler_id);
      setProjects(projectsData);
      setUsers(usersData);
      setLoading(false);
    }).catch(err => {
      setError("Failed to load issue data");
      setLoading(false);
    });
  }, [issueId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          summary,
          description,
          status,
          priority,
          severity,
          reproducibility,
          handler_id: handlerId || null,
        }),
        cache: 'no-store'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update issue");
      }

      router.refresh();
      router.push(`/issues/${issueId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update issue");
      setSaving(false);
    }
  }

  if (loading) return <div>Loading...</div>;
  if (error && !summary) return <div className="text-red-600">Error: {error}</div>;

  const statuses = getAllStatuses();
  const priorities = getAllPriorities();
  const severities = getAllSeverities();
  const reproducibilities = getAllReproducibilities();

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <form onSubmit={submit} className="md:col-span-2 bg-white border rounded p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">Edit Issue #{issueId}</h1>
          <button
            type="button"
            onClick={() => router.push(`/issues/${issueId}`)}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Summary *</label>
          <input
            className="border w-full p-2 rounded"
            placeholder="Summary"
            value={summary}
            onChange={e=>setSummary(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Project *</label>
          <select
            className="border w-full p-2 rounded"
            value={projectId}
            onChange={e=>setProjectId(parseInt(e.target.value,10))}
            required
          >
            <option value={0}>Select Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="border w-full p-2 rounded"
              value={status}
              onChange={e=>setStatus(parseInt(e.target.value,10))}
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              className="border w-full p-2 rounded"
              value={priority}
              onChange={e=>setPriority(parseInt(e.target.value,10))}
            >
              {priorities.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Severity</label>
            <select
              className="border w-full p-2 rounded"
              value={severity}
              onChange={e=>setSeverity(parseInt(e.target.value,10))}
            >
              {severities.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Reproducibility</label>
            <select
              className="border w-full p-2 rounded"
              value={reproducibility}
              onChange={e=>setReproducibility(parseInt(e.target.value,10))}
            >
              {reproducibilities.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Assignee</label>
          <select
            className="border w-full p-2 rounded"
            value={handlerId}
            onChange={e=>setHandlerId(parseInt(e.target.value,10))}
          >
            <option value={0}>Unassigned</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.realname}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Editor value={description} onChange={setDescription} />
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="border rounded px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/issues/${issueId}`)}
            className="border rounded px-3 py-1 bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}