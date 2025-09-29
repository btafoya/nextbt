// /app/(dash)/layout.tsx
import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";

export default function DashLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="ml-72 flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}
