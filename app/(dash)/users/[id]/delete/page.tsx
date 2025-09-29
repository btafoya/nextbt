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
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete user");
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
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Delete User</h1>

      <div className="bg-white rounded-lg border p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-yellow-50 border border-yellow-200 px-4 py-3 rounded">
          <p className="text-yellow-800">
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
            className="border border-gray-300 px-6 py-2 rounded-lg hover:bg-gray-50 inline-block"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}