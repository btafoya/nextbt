// /app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  cookies().set("nextbt", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL("/login", origin));
}

export async function GET(req: NextRequest) {
  cookies().set("nextbt", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  const origin = req.nextUrl.origin;
  return NextResponse.redirect(new URL("/login", origin));
}
