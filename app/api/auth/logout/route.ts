export const dynamic = "force-dynamic";

// /app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { SessionData, getSessionOptions } from "@/lib/session-config";
import { logUserActivity, getClientIp, getUserAgent } from "@/lib/user-activity";

/**
 * Logout endpoint - destroys encrypted session and redirects to login
 *
 * Supports both POST and GET methods for flexibility
 */
export async function POST(req: NextRequest) {
  // Get the encrypted session
  const session = await getIronSession<SessionData>(cookies(), getSessionOptions());

  // Log logout before destroying session
  if (session.uid) {
    await logUserActivity({
      userId: session.uid,
      actionType: "logout",
      description: `User logged out`,
      ipAddress: getClientIp(req.headers),
      userAgent: getUserAgent(req.headers),
    });
  }

  // Destroy the encrypted session
  await session.destroy();

  // Use the request URL to ensure we redirect to the correct domain
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export async function GET(req: NextRequest) {
  // Get the encrypted session
  const session = await getIronSession<SessionData>(cookies(), getSessionOptions());

  // Log logout before destroying session
  if (session.uid) {
    await logUserActivity({
      userId: session.uid,
      actionType: "logout",
      description: `User logged out`,
      ipAddress: getClientIp(req.headers),
      userAgent: getUserAgent(req.headers),
    });
  }

  // Destroy the encrypted session
  await session.destroy();

  // Use the request URL to ensure we redirect to the correct domain
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}
