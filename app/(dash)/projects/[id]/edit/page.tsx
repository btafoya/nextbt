// /app/(dash)/projects/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Editor from "@/components/wysiwyg/Editor";

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string, 10);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(10);
  const [enabled, setEnabled] = useState(true);
  const [viewState, setViewState] = useState(10);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    async function loadProject() {
      const res = await fetch(`/api/projects/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setName(data.name);
        setDescription(data.description || "");
        setStatus(data.status);
        setEnabled(data.enabled);
        setViewState(data.view_state);
      } else {
        setError("Failed to load project");
      }
      setLoadingProject(false);
    }
    loadProject();
  }, [projectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, status, enabled, view_state: viewState })
    });

    if (res.ok) {
      router.push(`/projects/${projectId}`);
    } else {
      const data = await res.json();
      setError(data.error || "Failed to update project");
      setLoading(false);
    }
  }

  async function handleDelete() {
    setError("");
    setLoading(true);

    const res = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE"
    });

    if (res.ok) {
      router.push("/projects");
    } else {
      const data = await res.json();
      setError(data.error || "Failed to delete project");
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  }

  if (loadingProject) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Project</h1>
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

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <div className="flex gap-3 justify-between">
          <div className="flex gap-3">
            <button
              type="submit"
              className="border rounded p-2 bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              className="border rounded p-2"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              Cancel
            </button>
          </div>

          <button
            type="button"
            className="border rounded p-2 bg-red-600 text-white hover:bg-red-700"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={loading}
          >
            Delete Project
          </button>
        </div>
      </form>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 max-w-md space-y-4">
            <h2 className="text-xl font-bold">Confirm Deletion</h2>
            <p className="text-sm">
              Are you sure you want to delete this project? This action cannot be undone.
              All issues and data associated with this project will remain but may become orphaned.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="border rounded p-2"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="border rounded p-2 bg-red-600 text-white hover:bg-red-700"
                onClick={handleDelete}
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}