// /app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/db/client";
import { verifyMantisPassword } from "@/lib/mantis-crypto";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ ok: false, error: "Missing" }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { username } as any }); // model mapped via Prisma @@map
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const ok = await verifyMantisPassword(password, (user as any).password);
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

  // project access
  const memberships = await prisma.projectUser.findMany({ where: { userId: (user as any).id } as any });
  const projects = memberships.map((m: any) => m.projectId);

  cookies().set("mantislite", JSON.stringify({ uid: (user as any).id, username, projects }), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/"
  });

  return NextResponse.json({ ok: true });
}
