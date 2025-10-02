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
  const [status, setStatus] = useState(10); // Default: new
  const [priority, setPriority] = useState(30); // Default: normal
  const [severity, setSeverity] = useState(50); // Default: minor
  const [reproducibility, setReproducibility] = useState(10); // Default: always
  const [handlerId, setHandlerId] = useState(0); // Default: unassigned
  const [projects, setProjects] = useState<Project[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Category selection
  const [category, setCategory] = useState<string>("");

  // Website category fields
  const [websitePageUrl, setWebsitePageUrl] = useState("");
  const [websiteBrowser, setWebsiteBrowser] = useState("");
  const [websiteWhatDoing, setWebsiteWhatDoing] = useState("");
  const [websiteWhatHappened, setWebsiteWhatHappened] = useState("");
  const [websiteErrorMessage, setWebsiteErrorMessage] = useState("");

  // Hosting category fields
  const [hostingService, setHostingService] = useState("");
  const [hostingProblem, setHostingProblem] = useState("");
  const [hostingStartedAt, setHostingStartedAt] = useState("");
  const [hostingErrorMessage, setHostingErrorMessage] = useState("");

  // Email category fields
  const [emailDirection, setEmailDirection] = useState("");
  const [emailClient, setEmailClient] = useState("");
  const [emailProblem, setEmailProblem] = useState("");
  const [emailAddresses, setEmailAddresses] = useState("");
  const [emailErrorMessage, setEmailErrorMessage] = useState("");

  // Other category field
  const [otherDescription, setOtherDescription] = useState("");

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

  // Reset category-specific fields when category changes
  useEffect(() => {
    setWebsitePageUrl("");
    setWebsiteBrowser("");
    setWebsiteWhatDoing("");
    setWebsiteWhatHappened("");
    setWebsiteErrorMessage("");
    setHostingService("");
    setHostingProblem("");
    setHostingStartedAt("");
    setHostingErrorMessage("");
    setEmailDirection("");
    setEmailClient("");
    setEmailProblem("");
    setEmailAddresses("");
    setEmailErrorMessage("");
    setOtherDescription("");
  }, [category]);

  function generateDescriptionHtml(): string {
    switch (category) {
      case "website":
        return `
          <p><strong>Page URL:</strong> ${websitePageUrl}</p>
          <p><strong>Browser:</strong> ${websiteBrowser}</p>
          <p><strong>What I was doing:</strong></p>
          ${websiteWhatDoing}
          <p><strong>What happened:</strong></p>
          ${websiteWhatHappened}
          <p><strong>Error Message:</strong></p>
          ${websiteErrorMessage || "<p>None provided</p>"}
        `.trim();

      case "hosting":
        return `
          <p><strong>Service Affected:</strong> ${hostingService}</p>
          <p><strong>Problem Description:</strong></p>
          ${hostingProblem}
          <p><strong>Started At:</strong> ${hostingStartedAt}</p>
          <p><strong>Error Message:</strong></p>
          ${hostingErrorMessage || "<p>None provided</p>"}
        `.trim();

      case "email":
        return `
          <p><strong>Issue Type:</strong> ${emailDirection}</p>
          <p><strong>Email Client:</strong> ${emailClient}</p>
          <p><strong>Problem Description:</strong></p>
          ${emailProblem}
          <p><strong>Affected Addresses:</strong> ${emailAddresses || "Not specified"}</p>
          <p><strong>Error Message:</strong></p>
          ${emailErrorMessage || "<p>None provided</p>"}
        `.trim();

      case "other":
        return `
          <p><strong>Issue Description:</strong></p>
          ${otherDescription}
        `.trim();

      default:
        return "";
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    // Generate HTML description from category fields
    const generatedDescription = generateDescriptionHtml();

    await fetch("/api/issues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        summary,
        description: generatedDescription,
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
      {/* Helper Card */}
      <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
          <span>📝</span> Help Us Fix This Faster
        </h3>
        <div className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <p className="font-medium">Please provide as much detail as possible:</p>
          <ul className="ml-4 space-y-1">
            <li>✅ What&apos;s affected (page, service, email, etc.)</li>
            <li>✅ Screenshots (paste directly into any text field)</li>
            <li>✅ What you were trying to do</li>
            <li>✅ What happened instead</li>
            <li>✅ When it started</li>
          </ul>
          <p className="mt-2 text-xs">💡 Tip: Press Ctrl+V to paste screenshots</p>
        </div>
      </div>

      <form onSubmit={submit} className="bg-white dark:bg-boxdark border dark:border-strokedark rounded p-4 space-y-3">
        <h1 className="text-lg font-semibold dark:text-white">New Issue</h1>

        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Summary *</label>
          <input
            className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
            placeholder="Brief description of the issue"
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

        {/* Issue Category */}
        <div>
          <label className="block text-sm font-medium mb-1 dark:text-gray-200">Issue Category *</label>
          <select
            className="border dark:border-strokedark w-full p-2 rounded dark:bg-meta-4 dark:text-white"
            value={category}
            onChange={e=>setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            <option value="website">Website Issue</option>
            <option value="hosting">Hosting Issue</option>
            <option value="email">Email Issue</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Website Category Fields */}
        {category === "website" && (
          <div className="space-y-3 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
            <h3 className="font-semibold text-black dark:text-white">Website Issue Details</h3>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Which page has the problem? *</label>
              <input
                type="url"
                className="border dark:border-strokedark w-full p-2 rounded dark:bg-boxdark dark:text-white"
                placeholder="https://example.com/page"
                value={websitePageUrl}
                onChange={e=>setWebsitePageUrl(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">What browser are you using? *</label>
              <input
                className="border dark:border-strokedark w-full p-2 rounded dark:bg-boxdark dark:text-white"
                placeholder="Chrome, Safari, Firefox, Edge, etc."
                value={websiteBrowser}
                onChange={e=>setWebsiteBrowser(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">What were you trying to do? *</label>
              <Editor value={websiteWhatDoing} onChange={setWebsiteWhatDoing} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">What happened instead? *</label>
              <Editor value={websiteWhatHappened} onChange={setWebsiteWhatHappened} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Any error messages? (optional)</label>
              <Editor value={websiteErrorMessage} onChange={setWebsiteErrorMessage} />
            </div>
          </div>
        )}

        {/* Hosting Category Fields */}
        {category === "hosting" && (
          <div className="space-y-3 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
            <h3 className="font-semibold text-black dark:text-white">Hosting Issue Details</h3>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Which service is affected? *</label>
              <select
                className="border dark:border-strokedark w-full p-2 rounded dark:bg-boxdark dark:text-white"
                value={hostingService}
                onChange={e=>setHostingService(e.target.value)}
                required
              >
                <option value="">Select Service</option>
                <option value="Website">Website</option>
                <option value="Email">Email</option>
                <option value="Database">Database</option>
                <option value="FTP/File Access">FTP/File Access</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">What&apos;s not working? *</label>
              <Editor value={hostingProblem} onChange={setHostingProblem} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">When did this start? *</label>
              <input
                className="border dark:border-strokedark w-full p-2 rounded dark:bg-boxdark dark:text-white"
                placeholder="e.g., Today at 2pm, This morning, Yesterday..."
                value={hostingStartedAt}
                onChange={e=>setHostingStartedAt(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Any error messages? (optional)</label>
              <Editor value={hostingErrorMessage} onChange={setHostingErrorMessage} />
            </div>
          </div>
        )}

        {/* Email Category Fields */}
        {category === "email" && (
          <div className="space-y-3 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
            <h3 className="font-semibold text-black dark:text-white">Email Issue Details</h3>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Are you having trouble sending or receiving? *</label>
              <select
                className="border dark:border-strokedark w-full p-2 rounded dark:bg-boxdark dark:text-white"
                value={emailDirection}
                onChange={e=>setEmailDirection(e.target.value)}
                required
              >
                <option value="">Select Issue Type</option>
                <option value="Sending">Sending</option>
                <option value="Receiving">Receiving</option>
                <option value="Both">Both</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">What email program/app are you using? *</label>
              <input
                className="border dark:border-strokedark w-full p-2 rounded dark:bg-boxdark dark:text-white"
                placeholder="Gmail, Outlook, Apple Mail, Thunderbird, Phone app, etc."
                value={emailClient}
                onChange={e=>setEmailClient(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Describe the problem *</label>
              <Editor value={emailProblem} onChange={setEmailProblem} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Affected email addresses (optional)</label>
              <input
                className="border dark:border-strokedark w-full p-2 rounded dark:bg-boxdark dark:text-white"
                placeholder="you@example.com, recipient@example.com"
                value={emailAddresses}
                onChange={e=>setEmailAddresses(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Any error messages? (optional)</label>
              <Editor value={emailErrorMessage} onChange={setEmailErrorMessage} />
            </div>
          </div>
        )}

        {/* Other Category Field */}
        {category === "other" && (
          <div className="space-y-3 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-strokedark dark:bg-meta-4">
            <h3 className="font-semibold text-black dark:text-white">Issue Details</h3>

            <div>
              <label className="block text-sm font-medium mb-1 dark:text-gray-200">Please describe the issue in detail *</label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                Include as much information as possible: what&apos;s affected, what you were doing, what happened, when it started, etc.
              </p>
              <Editor value={otherDescription} onChange={setOtherDescription} />
            </div>
          </div>
        )}

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

        <button className="border rounded px-3 py-1 bg-blue-600 text-white hover:bg-blue-700">
          Create Issue
        </button>
      </form>
    </div>
  );
}
