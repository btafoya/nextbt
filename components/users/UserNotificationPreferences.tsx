"use client";

import { useState, useEffect } from "react";
import { getSeverityLabel } from "@/lib/mantis-enums";

interface NotificationPrefs {
  email_on_new: number;
  email_on_assigned: number;
  email_on_feedback: number;
  email_on_resolved: number;
  email_on_closed: number;
  email_on_reopened: number;
  email_on_bugnote: number;
  email_on_status: number;
  email_on_priority: number;
  email_on_new_min_severity: number;
  email_on_assigned_min_severity: number;
  email_on_feedback_min_severity: number;
  email_on_resolved_min_severity: number;
  email_on_closed_min_severity: number;
  email_on_reopened_min_severity: number;
  email_on_bugnote_min_severity: number;
  email_on_status_min_severity: number;
  email_on_priority_min_severity: number;
}

const severityOptions = [
  { value: 10, label: getSeverityLabel(10) },
  { value: 20, label: getSeverityLabel(20) },
  { value: 30, label: getSeverityLabel(30) },
  { value: 40, label: getSeverityLabel(40) },
  { value: 50, label: getSeverityLabel(50) },
  { value: 60, label: getSeverityLabel(60) },
  { value: 70, label: getSeverityLabel(70) },
];

interface UserNotificationPreferencesProps {
  userId: number;
}

export default function UserNotificationPreferences({ userId }: UserNotificationPreferencesProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  async function fetchPreferences() {
    try {
      const res = await fetch(`/api/users/${userId}/notifications`);
      if (res.ok) {
        const data = await res.json();
        setPrefs(data);
      }
    } catch (error) {
      console.error("Error fetching preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    if (!prefs) return;

    setSaving(true);
    setMessage("");

    try {
      const res = await fetch(`/api/users/${userId}/notifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (res.ok) {
        setMessage("Notification preferences saved successfully");
        setTimeout(() => setMessage(""), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save preferences");
      }
    } catch (error) {
      setMessage("Error saving preferences");
    } finally {
      setSaving(false);
    }
  }

  function toggleNotification(field: keyof NotificationPrefs) {
    if (!prefs) return;
    setPrefs({
      ...prefs,
      [field]: prefs[field] === 1 ? 0 : 1,
    });
  }

  function updateSeverity(field: keyof NotificationPrefs, value: number) {
    if (!prefs) return;
    setPrefs({
      ...prefs,
      [field]: value,
    });
  }

  if (loading) {
    return <div className="text-center dark:text-bodydark">Loading preferences...</div>;
  }

  if (!prefs) {
    return <div className="text-red-600 dark:text-red-400">Failed to load preferences</div>;
  }

  const notificationTypes = [
    { key: "email_on_new" as keyof NotificationPrefs, label: "New Issues", severityKey: "email_on_new_min_severity" as keyof NotificationPrefs },
    { key: "email_on_assigned" as keyof NotificationPrefs, label: "Issue Assignments", severityKey: "email_on_assigned_min_severity" as keyof NotificationPrefs },
    { key: "email_on_feedback" as keyof NotificationPrefs, label: "Feedback", severityKey: "email_on_feedback_min_severity" as keyof NotificationPrefs },
    { key: "email_on_resolved" as keyof NotificationPrefs, label: "Resolved Issues", severityKey: "email_on_resolved_min_severity" as keyof NotificationPrefs },
    { key: "email_on_closed" as keyof NotificationPrefs, label: "Closed Issues", severityKey: "email_on_closed_min_severity" as keyof NotificationPrefs },
    { key: "email_on_reopened" as keyof NotificationPrefs, label: "Reopened Issues", severityKey: "email_on_reopened_min_severity" as keyof NotificationPrefs },
    { key: "email_on_bugnote" as keyof NotificationPrefs, label: "Comments/Notes", severityKey: "email_on_bugnote_min_severity" as keyof NotificationPrefs },
    { key: "email_on_status" as keyof NotificationPrefs, label: "Status Changes", severityKey: "email_on_status_min_severity" as keyof NotificationPrefs },
    { key: "email_on_priority" as keyof NotificationPrefs, label: "Priority Changes", severityKey: "email_on_priority_min_severity" as keyof NotificationPrefs },
  ];

  return (
    <div className="bg-white dark:bg-boxdark border dark:border-strokedark rounded p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">Email Notification Preferences</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Configure notification settings for this user.
      </p>

      <div className="space-y-4">
        {notificationTypes.map((type) => (
          <div key={type.key} className="flex items-center justify-between p-4 border dark:border-strokedark rounded">
            <div className="flex items-center gap-4 flex-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[type.key] === 1}
                  onChange={() => toggleNotification(type.key)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                />
                <span className="ml-3 font-medium dark:text-white">{type.label}</span>
              </label>
            </div>

            {prefs[type.key] === 1 && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400">Min Severity:</label>
                <select
                  value={prefs[type.severityKey]}
                  onChange={(e) => updateSeverity(type.severityKey, parseInt(e.target.value, 10))}
                  className="border dark:border-strokedark rounded px-3 py-1 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {severityOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save Preferences"}
        </button>

        {message && (
          <span className={`text-sm ${message.includes("success") ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
            {message}
          </span>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> These preferences control which email notifications this user will receive.
          The minimum severity threshold determines the lowest severity level for which they&apos;ll receive notifications.
        </p>
      </div>
    </div>
  );
}
