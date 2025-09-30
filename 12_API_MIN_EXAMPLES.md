# 12 — Minimal API Route Examples

## `/app/api/auth/login/route.ts`
```ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyMantisPassword } from "@/lib/mantis-crypto";
import { prisma } from "@/db/client";

export async function POST(req: Request) {
  const { username, password } = await req.json();
  const user = await prisma.user.findFirst({ where: { username } });
  if (!user) return NextResponse.json({ ok:false }, { status: 401 });
  const ok = await verifyMantisPassword(password, user.password);
  if (!ok) return NextResponse.json({ ok:false }, { status: 401 });

  // gather projects
  const projects = await prisma.projectUser.findMany({ where: { userId: user.id } });
  cookies().set("nextbt", JSON.stringify({ uid: user.id, username, projects: projects.map(p=>p.projectId) }), { httpOnly: true, secure: true, sameSite: "lax", path: "/" });
  return NextResponse.json({ ok:true });
}
```

## `/app/api/issues/route.ts` (GET list)
```ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const projectId = parseInt(searchParams.get("projectId") ?? "0", 10) || undefined;
  const q = searchParams.get("q") ?? undefined;

  const where: any = {};
  if (projectId) where.projectId = projectId;
  if (q) where.summary = { contains: q };

  const rows = await prisma.issue.findMany({
    where,
    take: 100,
    orderBy: { lastUpdated: "desc" }
  });
  return NextResponse.json(rows);
}
```
