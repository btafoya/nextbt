import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientThemeWrapper } from "@/components/ClientThemeWrapper";
import { publicConfig } from "@/config/public";
import VersionChecker from "@/components/VersionChecker";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: publicConfig.siteName,
  description: "Modern interface for MantisBT bug tracking system",
  icons: {
    icon: publicConfig.siteLogo,
    shortcut: publicConfig.siteLogo,
    apple: publicConfig.siteLogo,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: publicConfig.siteName,
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: publicConfig.siteName,
    title: publicConfig.siteName,
    description: "Modern interface for MantisBT bug tracking system",
  },
  twitter: {
    card: "summary",
    title: publicConfig.siteName,
    description: "Modern interface for MantisBT bug tracking system",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="light">
      <head>
        <meta name="application-name" content={publicConfig.siteName} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content={publicConfig.siteName} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1c2434" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, shrink-to-fit=no, viewport-fit=cover"
        />
      </head>
      <body className={inter.className}>
        <ClientThemeWrapper>
          {children}
          <VersionChecker />
          <PWAInstallPrompt />
        </ClientThemeWrapper>
      </body>
    </html>
  );
}