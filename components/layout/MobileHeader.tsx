"use client";
import { useAtom } from "jotai";
import { Menu } from "lucide-react";
import { sidebarOpenAtom } from "@/lib/atoms";

export function MobileHeader() {
  const [, setSidebarOpen] = useAtom(sidebarOpenAtom);

  return (
    <div className="flex items-center justify-between mb-4 lg:hidden">
      <button
        onClick={() => setSidebarOpen(true)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Open navigation menu"
      >
        <Menu size={24} />
      </button>
    </div>
  );
}
