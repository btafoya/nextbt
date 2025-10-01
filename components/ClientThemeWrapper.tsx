"use client";

import { ThemeProvider } from "@/lib/theme-provider";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface ClientThemeWrapperProps {
  children: React.ReactNode;
}

export function ClientThemeWrapper({ children }: ClientThemeWrapperProps) {
  const [initialTheme, setInitialTheme] = useState<"light" | "dark" | "system">("light");
  const pathname = usePathname();

  // Force light mode on login page
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    // Skip theme fetch on login page
    if (isLoginPage) {
      setInitialTheme("light");
      return;
    }

    // Fetch user's theme preference from server
    fetch("/api/profile/theme")
      .then(res => res.json())
      .then(data => {
        if (data.theme && ["light", "dark", "system"].includes(data.theme)) {
          setInitialTheme(data.theme);
        }
      })
      .catch(() => {
        // If fetch fails (not logged in or error), use light mode
        setInitialTheme("light");
      });
  }, [isLoginPage]);

  return (
    <ThemeProvider defaultTheme={isLoginPage ? "light" : initialTheme}>
      {children}
    </ThemeProvider>
  );
}