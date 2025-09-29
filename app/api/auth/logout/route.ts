// /app/api/auth/logout/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  cookies().set("mantislite", "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
