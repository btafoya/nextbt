// /middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const cookie = req.cookies.get("nextbt")?.value;
  const isAuthed = !!cookie;
  const url = req.nextUrl.pathname;

  const inDash = url.startsWith("/issues") || url.startsWith("/projects") || url === "/";
  if (inDash && !isAuthed) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api/auth/login|api/auth/logout|public|favicon.ico).*)"],
};
