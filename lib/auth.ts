// /lib/auth.ts
import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import "server-only";
import {
  SessionData,
  getSessionOptions,
  isSessionExpired,
  shouldRefreshSession,
  updateSessionActivity,
  refreshSessionExpiration,
  SESSION_CONFIG
} from "./session-config";

// Re-export SessionData for convenience
export type { SessionData };

/**
 * Get the current session with automatic activity tracking and expiration validation
 *
 * @returns SessionData if valid session exists, null otherwise
 */
export async function getSession(): Promise<SessionData | null> {
  const session = await getIronSession<SessionData>(cookies(), getSessionOptions());

  // No session data
  if (!session.uid) {
    return null;
  }

  // Check if session is expired
  if (isSessionExpired(session)) {
    await session.destroy();
    return null;
  }

  // Update last activity timestamp
  const updated = updateSessionActivity(session);
  Object.assign(session, updated);
  await session.save();

  return session as SessionData;
}

/**
 * Require authentication - throws if no valid session
 *
 * @throws Error if not authenticated or session expired
 * @returns Valid SessionData
 */
export async function requireSession(): Promise<SessionData> {
  const session = await getSession();
  if (!session) {
    throw new Error("Not authenticated");
  }
  return session;
}

/**
 * Check if session has admin access
 *
 * @param session - Session to check (null returns false)
 * @returns true if session has admin access level
 */
export function isAdmin(session: SessionData | null): boolean {
  return session !== null && session.access_level >= SESSION_CONFIG.ADMIN_ACCESS_LEVEL;
}

/**
 * Require admin access - throws if not admin
 *
 * @throws Error if not authenticated or not admin
 * @returns Valid SessionData with admin access
 */
export async function requireAdmin(): Promise<SessionData> {
  const session = await requireSession();
  if (!isAdmin(session)) {
    throw new Error("Admin access required");
  }
  return session;
}

/**
 * Refresh session expiration if within refresh threshold
 *
 * @param session - Session to check and potentially refresh
 * @returns true if session was refreshed
 */
export async function refreshSession(session: SessionData): Promise<boolean> {
  if (!shouldRefreshSession(session)) {
    return false;
  }

  const ironSession = await getIronSession<SessionData>(cookies(), getSessionOptions());
  const refreshed = refreshSessionExpiration(session);
  Object.assign(ironSession, refreshed);
  await ironSession.save();

  return true;
}
