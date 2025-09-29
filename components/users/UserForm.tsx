// /components/users/UserForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type UserFormProps = {
  user?: {
    id: number;
    username: string;
    realname: string;
    email: string;
    enabled: number;
    access_level: number;
  };
  mode: "create" | "edit";
};

const ACCESS_LEVELS = [
  { value: 10, label: "Viewer" },
  { value: 25, label: "Reporter" },
  { value: 40, label: "Updater" },
  { value: 55, label: "Developer" },
  { value: 70, label: "Manager" },
  { value: 90, label: "Administrator" },
];

export function UserForm({ user, mode }: UserFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: user?.username || "",
    realname: user?.realname || "",
    email: user?.email || "",
    password: "",
    access_level: user?.access_level || 25,
    enabled: user?.enabled !== undefined ? user.enabled : 1,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = mode === "create" ? "/api/users" : `/api/users/${user!.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const body: any = {
        username: formData.username,
        realname: formData.realname,
        email: formData.email,
        access_level: formData.access_level,
        enabled: formData.enabled,
      };

      // Only include password if it's provided
      if (formData.password) {
        body.password = formData.password;
      } else if (mode === "create") {
        setError("Password is required for new users");
        setLoading(false);
        return;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save user");
        setLoading(false);
        return;
      }

      router.push("/users");
      router.refresh();
    } catch (err) {
      setError("An error occurred");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Username *
        </label>
        <input
          type="text"
          required
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Real Name
        </label>
        <input
          type="text"
          value={formData.realname}
          onChange={(e) => setFormData({ ...formData, realname: e.target.value })}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email *
        </label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full border rounded-lg px-4 py-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password {mode === "create" ? "*" : "(leave blank to keep current)"}
        </label>
        <input
          type="password"
          required={mode === "create"}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          className="w-full border rounded-lg px-4 py-2"
          placeholder={mode === "edit" ? "Leave blank to keep current password" : ""}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Access Level *
        </label>
        <select
          required
          value={formData.access_level}
          onChange={(e) => setFormData({ ...formData, access_level: parseInt(e.target.value) })}
          className="w-full border rounded-lg px-4 py-2"
        >
          {ACCESS_LEVELS.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={formData.enabled === 1}
            onChange={(e) => setFormData({ ...formData, enabled: e.target.checked ? 1 : 0 })}
            className="rounded"
          />
          <span className="text-sm font-medium text-gray-700">Enabled</span>
        </label>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : mode === "create" ? "Create User" : "Update User"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/users")}
          className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}