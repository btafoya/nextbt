"use client";

import { useState, useEffect, useCallback } from "react";
import { logger } from "@/lib/logger";

interface ActivityEntry {
  id: number;
  user_id: number;
  action_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  date_created: number;
}

interface ActivityResponse {
  data: ActivityEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function UserActivityLog() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);
  const [filterType, setFilterType] = useState("");

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filterType) params.append("action_type", filterType);

      const res = await fetch(`/api/user-activity?${params}`);
      if (res.ok) {
        const data: ActivityResponse = await res.json();
        setActivities(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      logger.error("Error fetching user activity:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filterType, limit]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  function formatActionType(actionType: string): string {
    return actionType
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function getActionBadgeColor(actionType: string): string {
    switch (actionType) {
      case "login":
        return "bg-green-500";
      case "logout":
        return "bg-gray-500";
      case "login_failed":
        return "bg-red-500";
      case "profile_update":
      case "email_change":
        return "bg-blue-500";
      case "password_change":
        return "bg-amber-500";
      default:
        return "bg-gray-600";
    }
  }

  if (loading && activities.length === 0) {
    return (
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="text-center py-10 dark:text-bodydark">Loading activity...</div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Filters */}
      <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white mb-4">Activity Filter</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
              Action Type
            </label>
            <select
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            >
              <option value="">All Activities</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="login_failed">Login Failed</option>
              <option value="profile_update">Profile Update</option>
              <option value="email_change">Email Change</option>
              <option value="password_change">Password Change</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                Date
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                Action
              </th>
              <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
                Description
              </th>
              <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                IP Address
              </th>
              <th className="min-w-[200px] px-4 py-4 font-medium text-black dark:text-white">
                User Agent
              </th>
            </tr>
          </thead>
          <tbody>
            {activities.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 dark:text-bodydark">
                  No activity found
                </td>
              </tr>
            ) : (
              activities.map((entry) => (
                <tr key={entry.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-5 dark:text-white">
                    <div className="text-sm">{formatDate(entry.date_created)}</div>
                  </td>
                  <td className="px-4 py-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getActionBadgeColor(
                        entry.action_type
                      )} text-white`}
                    >
                      {formatActionType(entry.action_type)}
                    </span>
                  </td>
                  <td className="px-4 py-5 dark:text-white">
                    <div className="text-sm">{entry.description}</div>
                    {entry.old_value && entry.new_value && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Changed from: {entry.old_value} → {entry.new_value}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-5 dark:text-white">
                    <div className="text-sm font-mono">
                      {entry.ip_address || (
                        <span className="text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 dark:text-white">
                    <div className="text-xs truncate max-w-[200px]" title={entry.user_agent || ""}>
                      {entry.user_agent || (
                        <span className="text-gray-500 dark:text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-stroke px-7 py-4 dark:border-strokedark">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {activities.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
          {Math.min(page * limit, total)} of {total} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center justify-center rounded-md border border-stroke px-4 py-2 text-center font-medium hover:shadow-1 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:text-white"
          >
            Previous
          </button>
          <div className="flex items-center gap-2 px-4 dark:text-white">
            Page {page} of {totalPages}
          </div>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center justify-center rounded-md border border-stroke px-4 py-2 text-center font-medium hover:shadow-1 disabled:opacity-50 disabled:cursor-not-allowed dark:border-strokedark dark:text-white"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
