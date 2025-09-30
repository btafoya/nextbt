"use client";

import { ThemeToggle } from "@/components/ThemeToggle";

interface HeaderProps {
  title?: string;
  children?: React.ReactNode;
}

export function Header({ title, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div>
        {title && <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>}
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {children}
      </div>
    </header>
  );
}
