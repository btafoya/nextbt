// /app/(dash)/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: number;
  username: string;
  realname: string;
  email: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [realname, setRealname] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/profile", { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setRealname(data.realname || "");
        setEmail(data.email || "");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load profile");
        setLoading(false);
      });
  }, []);

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ realname, email }),
        cache: 'no-store'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setMessage("Profile updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    setSaving(true);

    try {
      const res = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
        cache: 'no-store'
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to change password");
      }

      setMessage("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6">Loading profile...</div>;
  }

  if (!profile) {
    return <div className="p-6 text-red-600">Failed to load profile</div>;
  }

  return (
    <div className="max-w-4xl space-y-6">
      {message && (
        <div className="rounded bg-green-50 border border-green-200 p-3 text-green-800">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded bg-red-50 border border-red-200 p-3 text-red-800">
          {error}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white border rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
        <form onSubmit={updateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              className="border w-full p-2 rounded bg-gray-50"
              value={profile.username}
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Real Name</label>
            <input
              type="text"
              className="border w-full p-2 rounded"
              value={realname}
              onChange={e => setRealname(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              className="border w-full p-2 rounded"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your.email@example.com"
            />
          </div>

          <button
            type="submit"
            className="border rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : "Update Profile"}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white border rounded p-6">
        <h2 className="text-xl font-semibold mb-4">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password *</label>
            <input
              type="password"
              className="border w-full p-2 rounded"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">New Password *</label>
            <input
              type="password"
              className="border w-full p-2 rounded"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password *</label>
            <input
              type="password"
              className="border w-full p-2 rounded"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            className="border rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}