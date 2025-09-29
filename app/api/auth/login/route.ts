// /app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/db/client";
import { verifyMantisPassword } from "@/lib/mantis-crypto";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ ok: false, error: "Missing" }, { status: 400 });

  const user = await prisma.mantis_user_table.findFirst({ where: { username } });
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const ok = await verifyMantisPassword(password, user.password);
  if (!ok) return NextResponse.json({ ok: false }, { status: 401 });

  // project access
  let projects: number[];

  // Administrators (access_level >= 90) have access to all projects
  if (user.access_level >= 90) {
    const allProjects = await prisma.mantis_project_table.findMany({
      select: { id: true }
    });
    projects = allProjects.map(p => p.id);
  } else {
    const memberships = await prisma.mantis_project_user_list_table.findMany({
      where: { user_id: user.id }
    });
    projects = memberships.map((m) => m.project_id);
  }

  cookies().set("mantislite", JSON.stringify({ uid: user.id, username, projects }), {
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/"
  });

  return NextResponse.json({ ok: true });
}
