"use client";

import { ThemeProvider } from "@/lib/theme-provider";
import { useEffect, useState } from "react";

interface ClientThemeWrapperProps {
  children: React.ReactNode;
  serverTheme?: string;
}

export function ClientThemeWrapper({ children, serverTheme }: ClientThemeWrapperProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash of unstyled content during hydration
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeProvider
      defaultTheme={serverTheme as "light" | "dark" | "system" || "system"}
    >
      {children}
    </ThemeProvider>
  );
}