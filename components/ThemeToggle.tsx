"use client";

import { useTheme } from "@/lib/theme-provider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSun, faMoon, faCircleHalfStroke } from "@fortawesome/free-solid-svg-icons";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const handleToggle = () => {
    const themes: Array<"light" | "dark" | "system"> = ["light", "dark", "system"];
    const currentIndex = themes.indexOf(theme);
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(nextTheme);
  };

  const getIcon = () => {
    switch (theme) {
      case "light":
        return faSun;
      case "dark":
        return faMoon;
      case "system":
        return faCircleHalfStroke;
      default:
        return faSun;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case "light":
        return "Light theme";
      case "dark":
        return "Dark theme";
      case "system":
        return "System theme";
      default:
        return "Light theme";
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-stroke bg-gray-2 text-dark transition-colors hover:bg-primary hover:text-white dark:border-strokedark dark:bg-meta-4 dark:text-white"
      aria-label={getLabel()}
      title={getLabel()}
    >
      <FontAwesomeIcon icon={getIcon()} className="h-5 w-5" />
    </button>
  );
}