// /app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  cookies().set("nextbt", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  // Use the request URL to ensure we redirect to the correct domain
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export async function GET(req: NextRequest) {
  cookies().set("nextbt", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  // Use the request URL to ensure we redirect to the correct domain
  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}
