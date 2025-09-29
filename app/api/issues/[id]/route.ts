// /app/api/issues/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canViewProject } from "@/lib/permissions";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseInt(params.id, 10);
  const row = await prisma.issue.findUnique({ where: { id } as any, include: { text: true } as any });
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  if (!canViewProject(session, (row as any).projectId)) return NextResponse.json({ ok: false }, { status: 403 });

  return NextResponse.json(row);
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseInt(params.id, 10);
  const payload = await req.json();

  const row = await prisma.issue.findUnique({ where: { id } as any });
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  if (!canViewProject(session, (row as any).projectId)) return NextResponse.json({ ok: false }, { status: 403 });

  const updated = await prisma.issue.update({ where: { id } as any, data: payload as any });
  return NextResponse.json(updated);
}
