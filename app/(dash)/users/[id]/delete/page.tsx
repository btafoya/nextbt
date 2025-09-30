// /app/(dash)/users/[id]/delete/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function DeleteUserPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/users/${params.id}`, {
        method: "DELETE",
        cache: 'no-store'
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete user");
        setLoading(false);
        return;
      }

      router.refresh();
      router.push("/users");
    } catch (err) {
      setError("An error occurred");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold dark:text-white">Delete User</h1>

      <div className="bg-white dark:bg-boxdark rounded-lg border dark:border-strokedark p-6 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 px-4 py-3 rounded">
          <p className="text-yellow-800 dark:text-yellow-200">
            <strong>Warning:</strong> Are you sure you want to delete this user? This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete User"}
          </button>
          <Link
            href="/users"
            className="border border-gray-300 dark:border-strokedark px-6 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-meta-4 dark:text-white inline-block"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}