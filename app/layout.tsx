import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientThemeWrapper } from "@/components/ClientThemeWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextBT - Bug Tracking",
  description: "Modern interface for MantisBT bug tracking system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientThemeWrapper>
          {children}
        </ClientThemeWrapper>
      </body>
    </html>
  );
}