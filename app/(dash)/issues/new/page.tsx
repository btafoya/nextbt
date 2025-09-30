// /app/(dash)/issues/new/page.tsx
"use client";

import { useState, useEffect } from "react";
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

export default function NewIssuePage() {
  const [summary, setSummary] = useState("");
  const [projectId, setProjectId] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState(10); // Default: new
  const [priority, setPriority] = useState(30); // Default: normal
  const [severity, setSeverity] = useState(50); // Default: minor
  const [reproducibility, setReproducibility] = useState(10); // Default: always
  const [handlerId, setHandlerId] = useState(0); // Default: unassigned
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/projects?active=true", { cache: 'no-store' })
      .then(res => res.json())
      .then(projectsData => {
        setProjects(projectsData);
        setLoading(false);
      });
  }, []);

  // Fetch users when project is selected
  useEffect(() => {
    if (projectId > 0) {
      setHandlerId(0); // Reset assignee when project changes
      fetch(`/api/users/assignable?projectId=${projectId}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(usersData => {
          setUsers(usersData);
        });
    } else {
      setUsers([]);
      setHandlerId(0);
    }
  }, [projectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/issues", {
      method: "POST",
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
    window.location.href = "/issues";
  }

  if (loading) return <div>Loading...</div>;

  const statuses = getAllStatuses();
  const priorities = getAllPriorities();
  const severities = getAllSeverities();
  const reproducibilities = getAllReproducibilities();

  return (
    <div className="max-w-4xl">
      <form onSubmit={submit} className="bg-white dark:bg-boxdark border dark:border-strokedark rounded p-4 space-y-3">
        <h1 className="text-lg font-semibold dark:text-white">New Issue</h1>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Summary *</label>
          <input
            className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
            placeholder="Summary"
            value={summary}
            onChange={e=>setSummary(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Project *</label>
          <select
            className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
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
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Status</label>
            <select
              className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
              value={status}
              onChange={e=>setStatus(parseInt(e.target.value,10))}
            >
              {statuses.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Priority</label>
            <select
              className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
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
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Severity</label>
            <select
              className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
              value={severity}
              onChange={e=>setSeverity(parseInt(e.target.value,10))}
            >
              {severities.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 dark:text-gray-200">Reproducibility</label>
            <select
              className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
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
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Assignee</label>
          <select
            className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
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
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Description</label>
          <Editor value={description} onChange={setDescription} />
        </div>

        <button className="border rounded px-3 py-1 bg-blue-600 text-white hover:bg-blue-700">
          Create Issue
        </button>
      </form>
    </div>
  );
}
