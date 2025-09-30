// /app/(dash)/layout.tsx
import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { requireSession } from "@/lib/auth";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-boxdark-2">
      <Sidebar session={session} />
      <main className="ml-72 flex-1 overflow-auto p-6 dark:bg-boxdark-2">{children}</main>
    </div>
  );
}
