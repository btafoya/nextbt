// /middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import {
  SessionData,
  getSessionOptions,
  isSessionExpired,
  updateSessionActivity,
  SESSION_CONFIG
} from "./lib/session-config";

/**
 * Middleware for protecting dashboard routes and validating sessions
 *
 * - Checks for valid encrypted session cookie
 * - Validates session expiration and inactivity timeout
 * - Updates last activity timestamp
 * - Redirects unauthenticated users to login
 */
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.pathname;

  // Check if accessing protected dashboard routes
  const inDash = url.startsWith("/issues") || url.startsWith("/projects") || url === "/";

  if (inDash) {
    // Get and validate session
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(req, response, getSessionOptions());

    // No session data
    if (!session.uid) {
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Check session expiration
    if (isSessionExpired(session)) {
      await session.destroy();
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Update last activity timestamp
    const updated = updateSessionActivity(session);
    Object.assign(session, updated);
    await session.save();

    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api/auth/login|api/auth/logout|public|favicon.ico).*)"],
};
