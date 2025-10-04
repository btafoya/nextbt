"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

interface NotificationRecord {
  id: string;
  eventType: string;
  title: string;
  body: string;
  channels: string[];
  read: boolean;
  createdAt: string;
}

interface HistoryResponse {
  notifications: NotificationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface StatsResponse {
  total: number;
  unread: number;
}

export default function NotificationHistory() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [stats, setStats] = useState<StatsResponse>({ total: 0, unread: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterChannel, setFilterChannel] = useState<string>("all");
  const [message, setMessage] = useState("");

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (filterChannel !== "all") {
        params.append("channel", filterChannel);
      }

      const res = await fetch(`/api/profile/notifications/history?${params}`);
      if (res.ok) {
        const data: HistoryResponse = await res.json();
        setNotifications(data.notifications || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else if (res.status === 401 || res.status === 403) {
        window.location.href = "/login";
      }
    } catch (error) {
      logger.error("Error fetching notification history:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filterChannel]);

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [fetchHistory]);

  async function fetchStats() {
    try {
      const res = await fetch("/api/profile/notifications/history/stats");
      if (res.ok) {
        const data: StatsResponse = await res.json();
        setStats(data);
      }
    } catch (error) {
      logger.error("Error fetching notification stats:", error);
    }
  }

  async function markAsRead(id: string) {
    try {
      const res = await fetch(`/api/profile/notifications/${id}/read`, {
        method: "PATCH",
      });

      if (res.ok) {
        setMessage("Marked as read");
        setTimeout(() => setMessage(""), 2000);
        fetchHistory();
        fetchStats();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to mark as read");
      }
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      setMessage("Error marking notification as read");
    }
  }

  async function markAllAsRead() {
    try {
      const res = await fetch("/api/profile/notifications/mark-all-read", {
        method: "POST",
      });

      if (res.ok) {
        setMessage("All notifications marked as read");
        setTimeout(() => setMessage(""), 2000);
        fetchHistory();
        fetchStats();
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to mark all as read");
      }
    } catch (error) {
      logger.error("Error marking all as read:", error);
      setMessage("Error marking all as read");
    }
  }

  function getEventIcon(eventType: string): string {
    const icons: Record<string, string> = {
      issue_created: "🆕",
      issue_updated: "📝",
      issue_assigned: "👤",
      issue_closed: "✅",
      note_added: "💬",
      status_changed: "🔄",
      priority_changed: "⚡",
      file_attached: "📎",
      mention: "🔔",
    };
    return icons[eventType] || "📬";
  }

  function getEventColor(eventType: string): string {
    const colors: Record<string, string> = {
      issue_created: "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300",
      issue_updated: "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
      issue_assigned: "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300",
      issue_closed: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300",
      note_added: "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
      status_changed: "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300",
      priority_changed: "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300",
      file_attached: "bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300",
      mention: "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300",
    };
    return colors[eventType] || "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300";
  }

  function getRelativeTime(dateString: string): string {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: diffDays > 365 ? "numeric" : undefined,
    }).format(date);
  }

  const channels = [
    { id: "all", label: "All Channels" },
    { id: "email", label: "📧 Email" },
    { id: "pushover", label: "📱 Pushover" },
    { id: "rocketchat", label: "💬 Rocket.Chat" },
    { id: "teams", label: "👥 Teams" },
    { id: "webpush", label: "🔔 Web Push" },
  ];

  if (loading && notifications.length === 0) {
    return (
      <div className="text-center py-8 dark:text-bodydark">
        Loading notification history...
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-boxdark border dark:border-strokedark rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold dark:text-white">
          Notification History
        </h2>
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {stats.total} total • {stats.unread} unread
          </div>
          {stats.unread > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Dropdown */}
      <div className="mb-6">
        <select
          value={filterChannel}
          onChange={(e) => {
            setFilterChannel(e.target.value);
            setPage(1);
          }}
          className="border dark:border-strokedark rounded-lg px-4 py-2 dark:bg-boxdark dark:text-bodydark focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.label}
            </option>
          ))}
        </select>
      </div>

      {/* Status Message */}
      {message && (
        <div className="mb-4 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
          {message}
        </div>
      )}

      {/* Notification List */}
      <div className="space-y-3 mb-6">
        {notifications.length === 0 ? (
          <div className="p-8 border dark:border-strokedark rounded-lg text-center text-gray-500 dark:text-gray-400">
            No notifications found
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 border dark:border-strokedark rounded-lg transition-colors ${
                notif.read
                  ? "bg-white dark:bg-boxdark"
                  : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-full ${getEventColor(
                      notif.eventType
                    )}`}
                  >
                    {getEventIcon(notif.eventType)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold dark:text-white truncate">
                      {notif.title}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {getRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {notif.body}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {notif.channels && notif.channels.length > 0 ? (
                        notif.channels.map((channel) => (
                          <span
                            key={channel}
                            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
                          >
                            {channel}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          No channels
                        </span>
                      )}
                    </div>

                    {!notif.read && (
                      <button
                        onClick={() => markAsRead(notif.id)}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-4 py-2 border dark:border-strokedark rounded-lg dark:text-bodydark hover:bg-gray-50 dark:hover:bg-meta-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-10 h-10 rounded-lg transition-colors ${
                    page === pageNum
                      ? "bg-blue-600 text-white"
                      : "border dark:border-strokedark dark:text-bodydark hover:bg-gray-50 dark:hover:bg-meta-4"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border dark:border-strokedark rounded-lg dark:text-bodydark hover:bg-gray-50 dark:hover:bg-meta-4 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
          📜 About Notification History
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>
            All notifications sent to you are logged here for reference
          </li>
          <li>
            Filter by channel to see notifications from specific sources
          </li>
          <li>
            Mark notifications as read to keep track of what you&apos;ve seen
          </li>
          <li>
            History is retained for 90 days by default
          </li>
        </ul>
      </div>
    </div>
  );
}
