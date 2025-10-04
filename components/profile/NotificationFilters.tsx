"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";

interface Filter {
  id: string;
  category?: string;
  priority?: number;
  severity?: number;
  action: "notify" | "ignore" | "digest_only";
  createdAt: string;
}

interface FilterStats {
  totalFilters: number;
  notifyCount: number;
  ignoreCount: number;
  digestCount: number;
}

export default function NotificationFilters() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [stats, setStats] = useState<FilterStats>({
    totalFilters: 0,
    notifyCount: 0,
    ignoreCount: 0,
    digestCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");

  // Form state
  const [newFilter, setNewFilter] = useState<Partial<Filter>>({
    category: "",
    priority: undefined,
    severity: undefined,
    action: "notify",
  });

  useEffect(() => {
    fetchFilters();
    fetchStats();
  }, []);

  async function fetchFilters() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/filters");
      if (res.ok) {
        const data = await res.json();
        setFilters(data.filters || []);
      } else if (res.status === 401 || res.status === 403) {
        window.location.href = "/login";
      }
    } catch (error) {
      logger.error("Error fetching filters:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await fetch("/api/profile/filters/stats");
      if (res.ok) {
        const data: FilterStats = await res.json();
        setStats(data);
      }
    } catch (error) {
      logger.error("Error fetching filter stats:", error);
    }
  }

  async function createFilter() {
    if (!newFilter.category && !newFilter.priority && !newFilter.severity) {
      setMessage("Please specify at least one filter criteria (category, priority, or severity)");
      return;
    }

    setCreating(true);
    setMessage("");

    try {
      const res = await fetch("/api/profile/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newFilter),
      });

      if (res.ok) {
        setMessage("Filter created successfully");
        setTimeout(() => setMessage(""), 3000);
        setNewFilter({
          category: "",
          priority: undefined,
          severity: undefined,
          action: "notify",
        });
        fetchFilters();
        fetchStats();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to create filter");
      }
    } catch (error) {
      logger.error("Error creating filter:", error);
      setMessage("Error creating filter");
    } finally {
      setCreating(false);
    }
  }

  async function deleteFilter(id: string) {
    try {
      const res = await fetch(`/api/profile/filters/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMessage("Filter deleted successfully");
        setTimeout(() => setMessage(""), 3000);
        fetchFilters();
        fetchStats();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to delete filter");
      }
    } catch (error) {
      logger.error("Error deleting filter:", error);
      setMessage("Error deleting filter");
    }
  }

  async function testFilter(filter: Filter) {
    try {
      const res = await fetch("/api/profile/filters/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filter),
      });

      if (res.ok) {
        const data = await res.json();
        setMessage(
          `Test result: ${data.matchCount} notification${data.matchCount !== 1 ? "s" : ""} would match this filter`
        );
        setTimeout(() => setMessage(""), 5000);
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to test filter");
      }
    } catch (error) {
      logger.error("Error testing filter:", error);
      setMessage("Error testing filter");
    }
  }

  function getActionBadge(action: Filter["action"]) {
    const badges = {
      notify: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300",
      ignore: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300",
      digest_only: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
    };
    return badges[action];
  }

  function getActionLabel(action: Filter["action"]) {
    const labels = {
      notify: "📬 Notify Immediately",
      ignore: "🔇 Ignore",
      digest_only: "📦 Digest Only",
    };
    return labels[action];
  }

  function getPriorityLabel(priority: number) {
    const labels: Record<number, string> = {
      10: "None",
      20: "Low",
      30: "Normal",
      40: "High",
      50: "Urgent",
      60: "Immediate",
    };
    return labels[priority] || `Priority ${priority}`;
  }

  function getSeverityLabel(severity: number) {
    const labels: Record<number, string> = {
      10: "Feature",
      20: "Trivial",
      30: "Text",
      40: "Tweak",
      50: "Minor",
      60: "Major",
      70: "Crash",
      80: "Block",
    };
    return labels[severity] || `Severity ${severity}`;
  }

  if (loading) {
    return (
      <div className="text-center py-8 dark:text-bodydark">
        Loading notification filters...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-boxdark border dark:border-strokedark rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4 dark:text-white">
        Notification Filters
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Create custom rules to control how specific notifications are handled based on category, priority, or severity.
      </p>

      {/* Filter Statistics */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="p-4 border dark:border-strokedark rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalFilters}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Filters</div>
        </div>
        <div className="p-4 border dark:border-strokedark rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.notifyCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Notify Rules</div>
        </div>
        <div className="p-4 border dark:border-strokedark rounded-lg">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.ignoreCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Ignore Rules</div>
        </div>
        <div className="p-4 border dark:border-strokedark rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.digestCount}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Digest Rules</div>
        </div>
      </div>

      {/* Create New Filter Form */}
      <div className="mb-6 p-4 border dark:border-strokedark rounded-lg bg-gray-50 dark:bg-meta-4">
        <h3 className="font-semibold mb-4 dark:text-white">Create New Filter</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium dark:text-white">
              Category (Optional)
            </label>
            <input
              type="text"
              value={newFilter.category || ""}
              onChange={(e) => setNewFilter({ ...newFilter, category: e.target.value })}
              placeholder="e.g., bug, feature"
              className="w-full border dark:border-strokedark rounded-lg px-3 py-2 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="block text-sm font-medium dark:text-white">
              Priority (Optional)
            </label>
            <select
              value={newFilter.priority || ""}
              onChange={(e) =>
                setNewFilter({
                  ...newFilter,
                  priority: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="w-full border dark:border-strokedark rounded-lg px-3 py-2 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              <option value="10">None</option>
              <option value="20">Low</option>
              <option value="30">Normal</option>
              <option value="40">High</option>
              <option value="50">Urgent</option>
              <option value="60">Immediate</option>
            </select>
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <label className="block text-sm font-medium dark:text-white">
              Severity (Optional)
            </label>
            <select
              value={newFilter.severity || ""}
              onChange={(e) =>
                setNewFilter({
                  ...newFilter,
                  severity: e.target.value ? parseInt(e.target.value, 10) : undefined,
                })
              }
              className="w-full border dark:border-strokedark rounded-lg px-3 py-2 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              <option value="10">Feature</option>
              <option value="20">Trivial</option>
              <option value="30">Text</option>
              <option value="40">Tweak</option>
              <option value="50">Minor</option>
              <option value="60">Major</option>
              <option value="70">Crash</option>
              <option value="80">Block</option>
            </select>
          </div>

          {/* Action */}
          <div className="space-y-2">
            <label className="block text-sm font-medium dark:text-white">Action</label>
            <select
              value={newFilter.action || "notify"}
              onChange={(e) =>
                setNewFilter({ ...newFilter, action: e.target.value as Filter["action"] })
              }
              className="w-full border dark:border-strokedark rounded-lg px-3 py-2 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="notify">Notify Immediately</option>
              <option value="ignore">Ignore</option>
              <option value="digest_only">Digest Only</option>
            </select>
          </div>
        </div>

        <button
          onClick={createFilter}
          disabled={creating}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {creating ? "Creating..." : "➕ Create Filter"}
        </button>
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`mb-4 p-3 rounded-lg ${
            message.includes("success") || message.includes("Successfully")
              ? "bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
              : "bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
          }`}
        >
          {message}
        </div>
      )}

      {/* Active Filters List */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold dark:text-white">
          Active Filters ({filters.length})
        </h3>

        {filters.length === 0 ? (
          <div className="p-8 border dark:border-strokedark rounded-lg text-center text-gray-500 dark:text-gray-400">
            No filters created yet. Create one above to customize notification behavior.
          </div>
        ) : (
          filters.map((filter) => (
            <div
              key={filter.id}
              className="p-4 border dark:border-strokedark rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getActionBadge(
                        filter.action
                      )}`}
                    >
                      {getActionLabel(filter.action)}
                    </span>
                  </div>

                  <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {filter.category && (
                      <p>
                        <span className="font-medium">Category:</span> {filter.category}
                      </p>
                    )}
                    {filter.priority && (
                      <p>
                        <span className="font-medium">Priority:</span>{" "}
                        {getPriorityLabel(filter.priority)}
                      </p>
                    )}
                    {filter.severity && (
                      <p>
                        <span className="font-medium">Severity:</span>{" "}
                        {getSeverityLabel(filter.severity)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => testFilter(filter)}
                    className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    🧪 Test
                  </button>
                  <button
                    onClick={() => deleteFilter(filter.id)}
                    className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          🔧 About Notification Filters
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>
            Filters allow you to customize notification behavior for specific types of issues
          </li>
          <li>
            <strong>Notify Immediately:</strong> Send notification right away (bypasses digest)
          </li>
          <li>
            <strong>Ignore:</strong> Suppress notifications matching this filter completely
          </li>
          <li>
            <strong>Digest Only:</strong> Include in digest batches, never send immediately
          </li>
          <li>
            Combine category, priority, and severity for precise control
          </li>
          <li>
            More specific filters take precedence over general ones
          </li>
        </ul>
      </div>
    </div>
  );
}
