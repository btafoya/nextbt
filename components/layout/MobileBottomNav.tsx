"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bug, Folder, User } from "lucide-react";

type SidebarProps = {
  session: {
    uid: number;
    username: string;
    projects: number[];
    access_level: number;
  };
};

export function MobileBottomNav({ session }: SidebarProps) {
  const pathname = usePathname();

  const mainNavItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/issues", label: "Issues", icon: Bug },
    { href: "/projects", label: "Projects", icon: Folder },
    { href: "/profile", label: "Profile", icon: User },
  ];

  return (
    <nav
      className="
        fixed bottom-0 left-0 right-0 z-30
        bg-white dark:bg-boxdark
        border-t border-gray-200 dark:border-strokedark
        lg:hidden
        safe-area-inset-bottom
      "
    >
      <div className="flex items-center justify-around px-2 py-2">
        {mainNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex flex-col items-center justify-center
                w-full min-h-[56px] rounded-lg
                transition-colors
                ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-600 dark:text-gray-400"
                }
                hover:bg-gray-100 dark:hover:bg-meta-4
                active:bg-gray-200 dark:active:bg-gray-700
              `}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
