// /components/projects/UserAssignment.tsx
"use client";

import { useState, useEffect } from "react";

type User = {
  id: number;
  username: string;
  realname: string;
  email: string;
};

type UserAssignmentProps = {
  selectedUserIds: number[];
  onChange: (userIds: number[]) => void;
};

export function UserAssignment({ selectedUserIds, onChange }: UserAssignmentProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (err) {
        console.error("Failed to fetch users:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  function toggleUser(userId: number) {
    if (selectedUserIds.includes(userId)) {
      onChange(selectedUserIds.filter(id => id !== userId));
    } else {
      onChange([...selectedUserIds, userId]);
    }
  }

  function selectAll() {
    onChange(users.map(u => u.id));
  }

  function clearAll() {
    onChange([]);
  }

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    (user.realname && user.realname.toLowerCase().includes(search.toLowerCase())) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-sm text-gray-600">Loading users...</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Assigned Users</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAll}
            className="text-xs text-blue-600 hover:underline"
          >
            Select All
          </button>
          <span className="text-xs text-gray-400">|</span>
          <button
            type="button"
            onClick={clearAll}
            className="text-xs text-blue-600 hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search users..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="border w-full p-2 rounded text-sm"
      />

      <div className="border rounded max-h-64 overflow-y-auto">
        {filteredUsers.length === 0 ? (
          <div className="p-4 text-sm text-gray-500 text-center">
            No users found
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map(user => (
              <label
                key={user.id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedUserIds.includes(user.id)}
                  onChange={() => toggleUser(user.id)}
                  className="rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{user.username}</div>
                  {user.realname && (
                    <div className="text-xs text-gray-600 truncate">
                      {user.realname}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      <div className="text-xs text-gray-600">
        {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  );
}
