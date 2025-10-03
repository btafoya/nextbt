// /app/(dash)/layout.tsx
import React from "react";
import { MobileSidebar } from "@/components/layout/MobileSidebar";
import { DesktopSidebar } from "@/components/layout/DesktopSidebar";
import { MobileHeader } from "@/components/layout/MobileHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { EdgeSwipeDetector } from "@/components/layout/EdgeSwipeDetector";
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
      {/* Edge swipe detector for opening sidebar from left edge */}
      <EdgeSwipeDetector />

      {/* Mobile: Hidden sidebar with drawer overlay */}
      <MobileSidebar session={sidebarSession} />

      {/* Desktop: Fixed sidebar (hidden on mobile) */}
      <DesktopSidebar session={sidebarSession} />

      {/* Main content - responsive margin */}
      <main className="flex-1 overflow-auto p-4 md:p-6 lg:ml-72 dark:bg-boxdark-2">
        {/* Mobile header with hamburger menu */}
        <MobileHeader />

        {/* Page content with bottom nav spacing on mobile */}
        <div className="pb-20 lg:pb-0">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      <MobileBottomNav session={sidebarSession} />
    </div>
  );
}
