"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAtom } from "jotai";
import { X } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { publicConfig } from "@/config/public";
import { sidebarOpenAtom } from "@/lib/atoms";

type SidebarProps = {
  session: {
    uid: number;
    username: string;
    projects: number[];
    access_level: number;
  };
};

export function MobileSidebar({ session }: SidebarProps) {
  const [isOpen, setIsOpen] = useAtom(sidebarOpenAtom);
  const pathname = usePathname();
  const isAdmin = session.access_level >= 90;

  const navItems = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/issues", label: "Issues", icon: "🐛" },
    { href: "/projects", label: "Projects", icon: "📁" },
  ];

  // Add admin-only links
  if (isAdmin) {
    navItems.push({ href: "/users", label: "Users", icon: "👥" });
    navItems.push({ href: "/history", label: "History Log", icon: "📜" });
  }

  // Add Profile link for all users
  navItems.push({ href: "/profile", label: "Profile", icon: "👤" });

  return (
    <>
      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen w-72
          transform transition-transform duration-300
          bg-white dark:bg-boxdark shadow-xl
          lg:hidden
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Sidebar content */}
        <div className="flex flex-col h-full">
          {/* Header with close button */}
          <div className="flex items-center justify-between px-6 py-4 border-b dark:border-strokedark">
            <div className="flex items-center gap-3">
              {publicConfig.siteLogo && (
                <Image
                  src={publicConfig.siteLogo}
                  alt={publicConfig.siteName}
                  width={32}
                  height={32}
                  priority
                />
              )}
              <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {publicConfig.siteName}
              </h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-meta-4 rounded-lg"
              aria-label="Close navigation menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation items */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg
                    text-base font-medium
                    min-h-[44px]
                    transition-colors
                    ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-meta-4"
                    }
                    active:bg-gray-200 dark:active:bg-gray-700
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Footer with theme toggle and logout */}
          <div className="border-t dark:border-strokedark p-4 space-y-3">
            <div className="flex items-center justify-center">
              <ThemeToggle />
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full rounded-lg px-4 py-3 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-meta-4 min-h-[44px] font-medium"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
