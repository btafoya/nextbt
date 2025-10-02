// /app/(dash)/layout.tsx
import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { requireSession } from "@/lib/auth";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  // Extract only serializable fields needed for Sidebar
  const sidebarSession = {
    uid: session.uid,
    username: session.username,
    projects: session.projects,
    access_level: session.access_level,
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-boxdark-2">
      <Sidebar session={sidebarSession} />
      <main className="ml-72 flex-1 overflow-auto p-6 dark:bg-boxdark-2">{children}</main>
    </div>
  );
}
