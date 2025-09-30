// /lib/session-config.ts
import "server-only";
import { SessionOptions } from "iron-session";
import { secrets } from "@/config/secrets";

/**
 * Session Data Structure
 *
 * Enhanced with security metadata for proper session management
 */
export interface SessionData {
  // User identity
  uid: number;
  username: string;
  access_level: number;
  projects: number[];

  // Security metadata
  createdAt: number;      // Unix timestamp when session was created
  expiresAt: number;      // Unix timestamp when session expires
  lastActivity: number;   // Unix timestamp of last activity

  // Session security
  userAgent?: string;     // User agent fingerprint (optional, for additional validation)
  ipAddress?: string;     // IP address (optional, for additional validation)
}

/**
 * Session Configuration Constants
 */
export const SESSION_CONFIG = {
  // Session duration: 7 days
  MAX_AGE: 60 * 60 * 24 * 7, // 7 days in seconds

  // Inactivity timeout: 2 hours
  INACTIVITY_TIMEOUT: 60 * 60 * 2, // 2 hours in seconds

  // Cookie name
  COOKIE_NAME: "nextbt_session",

  // Admin access level
  ADMIN_ACCESS_LEVEL: 90,

  // Session refresh threshold (refresh when within 1 day of expiry)
  REFRESH_THRESHOLD: 60 * 60 * 24, // 1 day in seconds
} as const;

/**
 * Iron Session Options
 *
 * Configured for maximum security with encryption, signing, and proper cookie attributes
 */
export function getSessionOptions(): SessionOptions {
  // Validate session secret exists
  if (!secrets.sessionSecret) {
    throw new Error(
      "SESSION_SECRET is not configured in secrets.ts. " +
      "Please add a strong random string (32+ characters) to your configuration."
    );
  }

  // Validate session secret length (minimum 32 characters for security)
  if (secrets.sessionSecret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be at least 32 characters long for security. " +
      `Current length: ${secrets.sessionSecret.length}`
    );
  }

  return {
    // Session password for encryption (32+ character secret)
    password: secrets.sessionSecret,

    // Cookie name
    cookieName: SESSION_CONFIG.COOKIE_NAME,

    // Cookie options
    cookieOptions: {
      // Maximum age in seconds (7 days)
      maxAge: SESSION_CONFIG.MAX_AGE,

      // Security flags
      httpOnly: true,       // Prevent JavaScript access (XSS protection)
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "lax",      // CSRF protection (lax allows GET from external sites)

      // Path and domain
      path: "/",            // Available across entire site
      // domain: undefined, // Use default (current domain)
    },

    // Time-to-live for session data (matches cookie maxAge)
    ttl: SESSION_CONFIG.MAX_AGE,
  };
}

/**
 * Validate if session is expired
 *
 * @param session - Session data to validate
 * @returns true if session is expired, false otherwise
 */
export function isSessionExpired(session: SessionData): boolean {
  const now = Date.now();

  // Check absolute expiration
  if (now > session.expiresAt) {
    return true;
  }

  // Check inactivity timeout
  const inactivityDuration = now - session.lastActivity;
  if (inactivityDuration > SESSION_CONFIG.INACTIVITY_TIMEOUT * 1000) {
    return true;
  }

  return false;
}

/**
 * Check if session should be refreshed
 *
 * @param session - Session data to check
 * @returns true if session should be refreshed, false otherwise
 */
export function shouldRefreshSession(session: SessionData): boolean {
  const now = Date.now();
  const timeUntilExpiry = session.expiresAt - now;

  // Refresh if within threshold of expiry
  return timeUntilExpiry < SESSION_CONFIG.REFRESH_THRESHOLD * 1000;
}

/**
 * Create new session data
 *
 * @param userData - User data to store in session
 * @param options - Optional session options
 * @returns New session data with security metadata
 */
export function createSessionData(
  userData: {
    uid: number;
    username: string;
    access_level: number;
    projects: number[];
  },
  options?: {
    userAgent?: string;
    ipAddress?: string;
  }
): SessionData {
  const now = Date.now();

  return {
    // User data
    uid: userData.uid,
    username: userData.username,
    access_level: userData.access_level,
    projects: userData.projects,

    // Security metadata
    createdAt: now,
    expiresAt: now + SESSION_CONFIG.MAX_AGE * 1000,
    lastActivity: now,

    // Optional security data
    userAgent: options?.userAgent,
    ipAddress: options?.ipAddress,
  };
}

/**
 * Update session activity timestamp
 *
 * @param session - Session to update
 * @returns Updated session with new lastActivity timestamp
 */
export function updateSessionActivity(session: SessionData): SessionData {
  return {
    ...session,
    lastActivity: Date.now(),
  };
}

/**
 * Refresh session expiration
 *
 * @param session - Session to refresh
 * @returns Updated session with new expiration
 */
export function refreshSessionExpiration(session: SessionData): SessionData {
  const now = Date.now();

  return {
    ...session,
    expiresAt: now + SESSION_CONFIG.MAX_AGE * 1000,
    lastActivity: now,
  };
}