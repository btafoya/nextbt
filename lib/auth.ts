// /lib/auth.ts
import { cookies } from "next/headers";
import "server-only";

export type SessionData = {
  uid: number;
  username: string;
  projects: number[];
};

const COOKIE_NAME = "mantislite";

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
