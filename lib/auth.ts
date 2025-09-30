// /lib/auth.ts
import { cookies } from "next/headers";
import "server-only";

export type SessionData = {
  uid: number;
  username: string;
  projects: number[];
  access_level: number;
};

const COOKIE_NAME = "nextbt";
const ADMIN_ACCESS_LEVEL = 90;

export function getSession(): SessionData | null {
  const jar = cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function requireSession(): SessionData {
  const s = getSession();
  if (!s) throw new Error("Not authenticated");
  return s;
}

export function isAdmin(session: SessionData | null): boolean {
  return session !== null && session.access_level >= ADMIN_ACCESS_LEVEL;
}

export function requireAdmin(): SessionData {
  const session = requireSession();
  if (!isAdmin(session)) {
    throw new Error("Admin access required");
  }
  return session;
}
