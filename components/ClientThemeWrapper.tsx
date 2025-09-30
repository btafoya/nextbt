"use client";

import { ThemeProvider } from "@/lib/theme-provider";
import { useEffect, useState } from "react";

interface ClientThemeWrapperProps {
  children: React.ReactNode;
}

export function ClientThemeWrapper({ children }: ClientThemeWrapperProps) {
  const [mounted, setMounted] = useState(false);
  const [initialTheme, setInitialTheme] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    setMounted(true);

    // Fetch user's theme preference from server
    fetch("/api/profile/theme")
      .then(res => res.json())
      .then(data => {
        if (data.theme && ["light", "dark", "system"].includes(data.theme)) {
          setInitialTheme(data.theme);
        }
      })
      .catch(() => {
        // If fetch fails (not logged in or error), use system default
        setInitialTheme("system");
      });
  }, []);

  // Prevent flash of unstyled content during hydration
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider defaultTheme={initialTheme}>
      {children}
    </ThemeProvider>
  );
}