"use client";

import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import Link from "next/link";

interface HistoryEntry {
  id: number;
  source: "bug_history" | "notification_history";
  user_id: number;
  bug_id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  type: number;
  date_modified: number;
  // Notification history specific fields
  recipient?: string;
  subject?: string;
  channel?: string;
  status?: string;
  error_message?: string;
  user: {
    id: number;
    username: string;
    realname: string;
  } | null;
  bug: {
    id: number;
    summary: string;
    project_id: number;
  } | null;
}

interface HistoryResponse {
  data: HistoryEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function HistoryLog() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(50);

  // Filters
  const [bugIdFilter, setBugIdFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [fieldNameFilter, setFieldNameFilter] = useState("");

  useEffect(() => {
    fetchHistory();
  }, [page, bugIdFilter, userIdFilter, fieldNameFilter]);

  async function fetchHistory() {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (bugIdFilter) params.append("bug_id", bugIdFilter);
      if (userIdFilter) params.append("user_id", userIdFilter);
      if (fieldNameFilter) params.append("field_name", fieldNameFilter);

      const res = await fetch(`/api/history?${params}`);
      if (res.ok) {
        const data: HistoryResponse = await res.json();
        setHistory(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      logger.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString();
  }

  function formatFieldName(field: string): string {
    return field
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  function getSourceBadgeColor(source: string): string {
    return source === "notification_history" ? "bg-blue-500" : "bg-success";
  }

  function getStatusBadgeColor(status: string | undefined): string {
    if (!status) return "bg-gray-500";
    switch (status) {
      case "read":
        return "bg-green-500";
      case "unread":
        return "bg-yellow-500";
      case "success":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "pending":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  }

  function applyFilters() {
    setPage(1);
    fetchHistory();
  }

  function clearFilters() {
    setBugIdFilter("");
    setUserIdFilter("");
    setFieldNameFilter("");
    setPage(1);
  }

  if (loading && history.length === 0) {
    return (
      <div className="rounded-sm border border-stroke bg-white px-5 pb-2.5 pt-6 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="text-center py-10 dark:text-bodydark">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
      {/* Filters */}
      <div className="border-b border-stroke px-7 py-4 dark:border-strokedark">
        <h3 className="font-medium text-black dark:text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
              Bug ID
            </label>
            <input
              type="text"
              placeholder="Filter by bug ID"
              value={bugIdFilter}
              onChange={(e) => setBugIdFilter(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
              User ID
            </label>
            <input
              type="text"
              placeholder="Filter by user ID"
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-2.5 block text-sm font-medium text-black dark:text-white">
              Field Name
            </label>
            <input
              type="text"
              placeholder="Filter by field name"
              value={fieldNameFilter}
              onChange={(e) => setFieldNameFilter(e.target.value)}
              className="w-full rounded border-[1.5px] border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            />
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            onClick={applyFilters}
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-3 text-center font-medium text-white hover:bg-opacity-90"
          >
            Apply Filters
          </button>
          <button
            onClick={clearFilters}
            className="inline-flex items-center justify-center rounded-md border border-stroke px-5 py-3 text-center font-medium hover:shadow-1 dark:border-strokedark dark:text-white"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white">
                ID
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                Date
              </th>
              <th className="min-w-[80px] px-4 py-4 font-medium text-black dark:text-white">
                Bug
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                User
              </th>
              <th className="min-w-[120px] px-4 py-4 font-medium text-black dark:text-white">
                Field
              </th>
              <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                Old Value
              </th>
              <th className="min-w-[150px] px-4 py-4 font-medium text-black dark:text-white">
                New Value
              </th>
              <th className="min-w-[50px] px-4 py-4 font-medium text-black dark:text-white">
                Type
              </th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 dark:text-bodydark">
                  No history entries found
                </td>
              </tr>
            ) : (
              history.map((entry) => (
                <tr key={entry.id} className="border-b border-stroke dark:border-strokedark">
                  <td className="px-4 py-5 dark:text-white">
                    {entry.id}
                  </td>
                  <td className="px-4 py-5 dark:text-white">
                    <div className="text-sm">{formatDate(entry.date_modified)}</div>
                  </td>
                  <td className="px-4 py-5">
                    <Link
                      href={`/issues/${entry.bug_id}`}
                      className="text-primary hover:underline"
                    >
                      #{entry.bug_id}
                    </Link>
                    {entry.bug && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate max-w-[200px]">
                        {entry.bug.summary}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-5 dark:text-white">
                    <div className="font-medium">{entry.user?.username || `User #${entry.user_id}`}</div>
                    {entry.user?.realname && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.user.realname}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-5 dark:text-white">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex rounded-full bg-opacity-10 px-3 py-1 text-sm font-medium ${getSourceBadgeColor(entry.source)} text-white dark:bg-opacity-20`}>
                        {formatFieldName(entry.field_name)}
                      </span>
                      {entry.source === "notification_history" && entry.channel && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          via {entry.channel}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 dark:text-white">
                    <div className="max-w-[200px] truncate text-sm">
                      {entry.source === "notification_history" ? (
                        <span className="text-gray-400 dark:text-gray-500">—</span>
                      ) : (
                        entry.old_value || <span className="text-gray-400 dark:text-gray-500">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 dark:text-white">
                    <div className="flex flex-col gap-1">
                      <div className="max-w-[200px] truncate text-sm">
                        {entry.new_value || <span className="text-gray-400 dark:text-gray-500">—</span>}
                      </div>
                      {entry.source === "notification_history" && entry.status && (
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium text-white ${getStatusBadgeColor(entry.status)}`}>
                          {entry.status}
                        </span>
                      )}
                      {entry.source === "notification_history" && entry.error_message && (
                        <span className="text-xs text-red-500 dark:text-red-400 truncate max-w-[200px]" title={entry.error_message}>
                          Error: {entry.error_message}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-5 dark:text-white">
                    {entry.source === "bug_history" ? entry.type : (
                      <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Notification
                      </span>
                    )}
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
          Showing {history.length > 0 ? (page - 1) * limit + 1 : 0} to{" "}
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
