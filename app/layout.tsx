import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientThemeWrapper } from "@/components/ClientThemeWrapper";
import { getSession } from "@/lib/auth";
import { prisma } from "@/db/client";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NextBT - Bug Tracking",
  description: "Modern interface for MantisBT bug tracking system",
};

async function getUserTheme(): Promise<string> {
  try {
    const session = await getSession();
    if (!session) return "system";

    const config = await prisma.mantis_config_table.findUnique({
      where: {
        config_id_project_id_user_id: {
          config_id: "nextbt_theme",
          project_id: 0,
          user_id: session.uid,
        },
      },
    });

    return config?.value || "system";
  } catch {
    return "system";
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const serverTheme = await getUserTheme();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ClientThemeWrapper serverTheme={serverTheme}>
          {children}
        </ClientThemeWrapper>
      </body>
    </html>
  );
}