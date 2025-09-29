"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationCircle,
  faUserCheck,
  faCommentDots,
  faLock
} from "@fortawesome/free-solid-svg-icons";

interface StatusActionsProps {
  issueId: number;
  currentStatus: number;
  canEdit: boolean;
}

const STATUS_TRANSITIONS: Record<number, Array<{ status: number; label: string; icon: any; color: string }>> = {
  10: [ // New
    { status: 20, label: "Request Feedback", icon: faCommentDots, color: "bg-yellow-600 hover:bg-yellow-700" },
    { status: 30, label: "Acknowledge", icon: faExclamationCircle, color: "bg-blue-600 hover:bg-blue-700" },
    { status: 50, label: "Assign", icon: faUserCheck, color: "bg-purple-600 hover:bg-purple-700" },
    { status: 80, label: "Resolve", icon: faCheckCircle, color: "bg-green-600 hover:bg-green-700" },
  ],
  20: [ // Feedback
    { status: 30, label: "Acknowledge", icon: faExclamationCircle, color: "bg-blue-600 hover:bg-blue-700" },
    { status: 50, label: "Assign", icon: faUserCheck, color: "bg-purple-600 hover:bg-purple-700" },
    { status: 80, label: "Resolve", icon: faCheckCircle, color: "bg-green-600 hover:bg-green-700" },
  ],
  30: [ // Acknowledged
    { status: 40, label: "Confirm", icon: faExclamationCircle, color: "bg-blue-600 hover:bg-blue-700" },
    { status: 50, label: "Assign", icon: faUserCheck, color: "bg-purple-600 hover:bg-purple-700" },
    { status: 80, label: "Resolve", icon: faCheckCircle, color: "bg-green-600 hover:bg-green-700" },
  ],
  40: [ // Confirmed
    { status: 50, label: "Assign", icon: faUserCheck, color: "bg-purple-600 hover:bg-purple-700" },
    { status: 80, label: "Resolve", icon: faCheckCircle, color: "bg-green-600 hover:bg-green-700" },
  ],
  50: [ // Assigned
    { status: 80, label: "Resolve", icon: faCheckCircle, color: "bg-green-600 hover:bg-green-700" },
    { status: 20, label: "Request Feedback", icon: faCommentDots, color: "bg-yellow-600 hover:bg-yellow-700" },
  ],
  80: [ // Resolved
    { status: 90, label: "Close", icon: faLock, color: "bg-gray-600 hover:bg-gray-700" },
    { status: 50, label: "Reopen", icon: faExclamationCircle, color: "bg-orange-600 hover:bg-orange-700" },
  ],
  90: [ // Closed
    { status: 50, label: "Reopen", icon: faExclamationCircle, color: "bg-orange-600 hover:bg-orange-700" },
  ],
};

export default function StatusActions({ issueId, currentStatus, canEdit }: StatusActionsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const transitions = STATUS_TRANSITIONS[currentStatus] || [];

  async function handleStatusChange(newStatus: number) {
    if (!confirm("Are you sure you want to change the status of this issue?")) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to update status");
      }
    } catch (err) {
      setError("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  if (!canEdit || transitions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border rounded p-4 space-y-3">
      <h3 className="font-semibold">Change Status</h3>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {transitions.map((transition) => (
          <button
            key={transition.status}
            onClick={() => handleStatusChange(transition.status)}
            disabled={loading}
            className={`${transition.color} text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50 transition-colors`}
          >
            <FontAwesomeIcon icon={transition.icon} />
            {transition.label}
          </button>
        ))}
      </div>
    </div>
  );
}