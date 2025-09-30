export const dynamic = "force-dynamic";

// /app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { prisma } from "@/db/client";
import { verifyMantisPassword } from "@/lib/mantis-crypto";
import { secrets } from "@/config/secrets";
import { logger } from "@/lib/logger";
import {
  SessionData,
  getSessionOptions,
  createSessionData
} from "@/lib/session-config";

export async function POST(req: Request) {
  const { username, password, turnstileToken } = await req.json();
  if (!username || !password) return NextResponse.json({ ok: false, error: "Missing credentials" }, { status: 400 });

  // Verify Cloudflare Turnstile token (if enabled)
  if (secrets.turnstileEnabled) {
    if (!turnstileToken) {
      return NextResponse.json({ error: "Missing verification token" }, { status: 400 });
    }

    try {
      const turnstileResponse = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            secret: secrets.turnstileSecretKey,
            response: turnstileToken,
          }),
        }
      );

      const turnstileData = await turnstileResponse.json();

      if (!turnstileData.success) {
        return NextResponse.json({ error: "Verification failed" }, { status: 400 });
      }
    } catch (error) {
      logger.error("Turnstile verification error:", error);
      return NextResponse.json({ error: "Verification error" }, { status: 500 });
    }
  }

  const user = await prisma.mantis_user_table.findFirst({ where: { username } });
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const ok = await verifyMantisPassword(password, user.password);
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

  // project access
  let projects: number[];

  // Administrators (access_level >= 90) have access to all projects
  if (user.access_level >= 90) {
    const allProjects = await prisma.mantis_project_table.findMany({
      select: { id: true }
    });
    projects = allProjects.map(p => p.id);
  } else {
    const memberships = await prisma.mantis_project_user_list_table.findMany({
      where: { user_id: user.id }
    });
    projects = memberships.map((m) => m.project_id);
  }

  // Get request headers for security metadata
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

  // Create secure encrypted session with iron-session
  const session = await getIronSession<SessionData>(cookies(), getSessionOptions());
  const sessionData = createSessionData(
    {
      uid: user.id,
      username,
      projects,
      access_level: user.access_level
    },
    {
      userAgent,
      ipAddress
    }
  );

  // Save session data (iron-session handles encryption and signing)
  Object.assign(session, sessionData);
  await session.save();

  return NextResponse.json({ ok: true });
}
