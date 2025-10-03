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
import { secrets } from "./config/secrets";

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
  // Protect page routes except login, but allow all API routes through
  // (API routes handle their own auth via requireSession())
  const isPublicRoute = url.startsWith("/login") || url.startsWith("/api/");
  const inDash = !isPublicRoute;

  if (inDash) {
    // Get and validate session
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(req, response, getSessionOptions());

    // No session data
    if (!session.uid) {
      const loginUrl = new URL("/login", secrets.baseUrl);
      loginUrl.searchParams.set("returnUrl", req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // Check session expiration
    if (isSessionExpired(session)) {
      await session.destroy();
      const loginUrl = new URL("/login", secrets.baseUrl);
      loginUrl.searchParams.set("returnUrl", req.nextUrl.pathname + req.nextUrl.search);
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
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public folder
     * - login page
     * - all API routes (they handle their own auth)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|login|api/).*)",
  ],
};
