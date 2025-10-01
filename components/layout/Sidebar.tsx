"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ThemeToggle";

type SidebarProps = {
  session: {
    uid: number;
    username: string;
    projects: number[];
    access_level: number;
  };
};

export function Sidebar({ session }: SidebarProps) {
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
    <aside className="sidebar">
      <div className="px-6 py-4">
        <h2 className="text-xl font-bold text-blue-600">NextBT</h2>
      </div>

      <nav className="sidebar-nav flex-1 space-y-1 px-4 py-6">
        {navItems.map((item) => {
          const activeClass = pathname === item.href ? "active" : "";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={"sidebar-nav-item " + activeClass}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4 dark:border-gray-700">
        <div className="mb-3 flex items-center justify-center">
          <ThemeToggle />
        </div>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="w-full rounded-lg px-4 py-2 text-left text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Logout
          </button>
        </form>
      </div>
    </aside>
  );
}
