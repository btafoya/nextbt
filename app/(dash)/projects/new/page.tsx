// /app/(dash)/projects/new/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Editor from "@/components/wysiwyg/Editor";
import { UserAssignment } from "@/components/projects/UserAssignment";

export default function NewProjectPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(10); // 10 = Development
  const [enabled, setEnabled] = useState(true);
  const [viewState, setViewState] = useState(10); // 10 = Public
  const [userIds, setUserIds] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, status, enabled, view_state: viewState, user_ids: userIds }),
      cache: 'no-store'
    });

    if (res.ok) {
      window.location.href = "/projects";
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create project");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create New Project</h1>
      </div>

      <form onSubmit={submit} className="bg-white border rounded p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Project Name *</label>
          <input
            type="text"
            className="border w-full p-2 rounded"
            placeholder="Project name"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Editor value={description} onChange={setDescription} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="border w-full p-2 rounded"
              value={status}
              onChange={e => setStatus(parseInt(e.target.value, 10))}
            >
              <option value={10}>Development</option>
              <option value={30}>Release</option>
              <option value={50}>Stable</option>
              <option value={70}>Obsolete</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">View State</label>
            <select
              className="border w-full p-2 rounded"
              value={viewState}
              onChange={e => setViewState(parseInt(e.target.value, 10))}
            >
              <option value={10}>Public</option>
              <option value={50}>Private</option>
            </select>
          </div>
        </div>

        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
            />
            <span className="text-sm font-medium">Enabled</span>
          </label>
        </div>

        <div className="border-t pt-4">
          <UserAssignment selectedUserIds={userIds} onChange={setUserIds} />
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            className="border rounded p-2 bg-blue-600 text-white hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
          <button
            type="button"
            className="border rounded p-2"
            onClick={() => router.push("/projects")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}