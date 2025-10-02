import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientThemeWrapper } from "@/components/ClientThemeWrapper";
import { publicConfig } from "@/config/public";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: publicConfig.siteName,
  description: "Modern interface for MantisBT bug tracking system",
  icons: {
    icon: publicConfig.siteLogo,
    shortcut: publicConfig.siteLogo,
    apple: publicConfig.siteLogo,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <body className={inter.className}>
        <ClientThemeWrapper>
          {children}
        </ClientThemeWrapper>
      </body>
    </html>
  );
}