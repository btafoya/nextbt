"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Dashboard", icon: "📊" },
    { href: "/issues", label: "Issues", icon: "🐛" },
    { href: "/projects", label: "Projects", icon: "📁" },
    { href: "/search", label: "Search", icon: "🔍" },
  ];

  return (
    <aside className="sidebar">
      <div className="px-6 py-4">
        <h2 className="text-xl font-bold text-blue-600">MantisLite</h2>
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
