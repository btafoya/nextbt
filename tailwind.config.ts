import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        stroke: "#e5e7eb",
        "gray-2": "#f9fafb",
        bodydark: "#6b7280",
        bodydark1: "#9ca3af",
        bodydark2: "#d1d5db",
        "meta-7": "#ef4444",
        // Dark mode specific colors
        strokedark: "#2e3a47",
        "meta-4": "#313d4a",
        boxdark: "#24303f",
        "boxdark-2": "#1a222c",
        graydark: "#333a48",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
  darkMode: "class",
};
export default config;