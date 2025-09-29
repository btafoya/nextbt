// /app/(dash)/layout.tsx
import React from "react";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
          <div className="font-semibold">MantisLite</div>
          <form action="/api/auth/logout" method="post">
            <button className="text-sm border rounded px-3 py-1" formMethod="post">Logout</button>
          </form>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-4">{children}</div>
    </div>
  );
}
