"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";

interface DigestPrefs {
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly";
  timeOfDay: number;
  dayOfWeek: number;
  minNotifications: number;
  includeChannels: string[];
}

export default function DigestPreferences() {
  const [prefs, setPrefs] = useState<DigestPrefs>({
    enabled: false,
    frequency: "daily",
    timeOfDay: 9,
    dayOfWeek: 1,
    minNotifications: 1,
    includeChannels: ["email"],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch("/api/profile/digest");
      if (res.ok) {
        const data = await res.json();
        if (data.preferences) {
          setPrefs(data.preferences);
        }
      }
    } catch (error) {
      logger.error("Error fetching digest preferences:", error);
    } finally {
      setLoading(false);
    }
  }

  async function savePreferences() {
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile/digest", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      if (res.ok) {
        setMessage("Digest preferences saved successfully");
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

  function toggleChannel(channel: string) {
    const newChannels = prefs.includeChannels.includes(channel)
      ? prefs.includeChannels.filter((c) => c !== channel)
      : [...prefs.includeChannels, channel];

    setPrefs({ ...prefs, includeChannels: newChannels });
  }

  if (loading) {
    return (
      <div className="text-center py-8 dark:text-bodydark">
        Loading digest preferences...
      </div>
    );
  }

  const channels = [
    { id: "email", label: "Email", icon: "📧" },
    { id: "pushover", label: "Pushover", icon: "📱" },
    { id: "rocketchat", label: "Rocket.Chat", icon: "💬" },
    { id: "teams", label: "Microsoft Teams", icon: "👥" },
    { id: "webpush", label: "Web Push", icon: "🔔" },
  ];

  const dayNames = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div className="bg-white dark:bg-boxdark border dark:border-strokedark rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        Notification Digest Settings
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Batch multiple notifications into a single digest delivery to reduce notification fatigue.
      </p>

      <div className="space-y-6">
        {/* Enable/Disable Digest */}
        <div className="flex items-center gap-3 p-4 border dark:border-strokedark rounded">
          <input
            type="checkbox"
            id="digest-enabled"
            checked={prefs.enabled}
            onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
          />
          <label htmlFor="digest-enabled" className="font-medium dark:text-white cursor-pointer">
            Enable Notification Digest
          </label>
        </div>

        {prefs.enabled && (
          <>
            {/* Frequency */}
            <div className="space-y-2">
              <label htmlFor="digest-frequency" className="block text-sm font-medium dark:text-white">
                Digest Frequency
              </label>
              <select
                id="digest-frequency"
                value={prefs.frequency}
                onChange={(e) =>
                  setPrefs({ ...prefs, frequency: e.target.value as DigestPrefs["frequency"] })
                }
                className="w-full border dark:border-strokedark rounded-lg px-4 py-2 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                How often to send digest notifications
              </p>
            </div>

            {/* Time of Day (for daily/weekly) */}
            {(prefs.frequency === "daily" || prefs.frequency === "weekly") && (
              <div className="space-y-2">
                <label className="block text-sm font-medium dark:text-white">
                  Delivery Time
                </label>
                <select
                  value={prefs.timeOfDay}
                  onChange={(e) =>
                    setPrefs({ ...prefs, timeOfDay: parseInt(e.target.value, 10) })
                  }
                  className="w-full border dark:border-strokedark rounded-lg px-4 py-2 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, "0")}:00 ({i === 0 ? "Midnight" : i === 12 ? "Noon" : i < 12 ? `${i} AM` : `${i - 12} PM`})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  What time of day to send the digest
                </p>
              </div>
            )}

            {/* Day of Week (for weekly) */}
            {prefs.frequency === "weekly" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium dark:text-white">
                  Delivery Day
                </label>
                <select
                  value={prefs.dayOfWeek}
                  onChange={(e) =>
                    setPrefs({ ...prefs, dayOfWeek: parseInt(e.target.value, 10) })
                  }
                  className="w-full border dark:border-strokedark rounded-lg px-4 py-2 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {dayNames.slice(1).map((day, index) => (
                    <option key={index + 1} value={index + 1}>
                      {day}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Which day of the week to send the digest
                </p>
              </div>
            )}

            {/* Minimum Notifications */}
            <div className="space-y-2">
              <label className="block text-sm font-medium dark:text-white">
                Minimum Notifications
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={prefs.minNotifications}
                onChange={(e) =>
                  setPrefs({ ...prefs, minNotifications: parseInt(e.target.value, 10) })
                }
                className="w-full border dark:border-strokedark rounded-lg px-4 py-2 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Only send digest if this many notifications are queued (prevents empty digests)
              </p>
            </div>

            {/* Channel Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium dark:text-white">
                Channels to Include
              </label>
              <div className="space-y-2">
                {channels.map((channel) => (
                  <label
                    key={channel.id}
                    className="flex items-center gap-3 p-3 border dark:border-strokedark rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-meta-4"
                  >
                    <input
                      type="checkbox"
                      checked={prefs.includeChannels.includes(channel.id)}
                      onChange={() => toggleChannel(channel.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <span className="text-lg">{channel.icon}</span>
                    <span className="dark:text-bodydark">{channel.label}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Which notification channels should receive digest notifications
              </p>
            </div>
          </>
        )}
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-4">
        <button
          onClick={savePreferences}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? "Saving..." : "Save Digest Settings"}
        </button>

        {message && (
          <span
            className={`text-sm ${
              message.includes("success")
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {message}
          </span>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          📦 About Notification Digests
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>
            Digests batch multiple notifications together to reduce notification fatigue
          </li>
          <li>
            Notifications are queued and delivered at your chosen frequency
          </li>
          <li>
            You can customize which channels receive digest notifications
          </li>
          <li>
            Immediate notifications can still be sent if configured in your filters
          </li>
        </ul>
      </div>
    </div>
  );
}
