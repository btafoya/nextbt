// /app/api/issues/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canViewProject } from "@/lib/permissions";

export async function GET(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = parseInt(searchParams.get("projectId") ?? "0", 10) || undefined;
  const q = searchParams.get("q") ?? undefined;

  const where: any = {};
  if (projectId) {
    if (!canViewProject(session, projectId)) return NextResponse.json([], { status: 200 });
    where.projectId = projectId;
  } else {
    // Limit to user's projects
    where.projectId = { in: session.projects };
  }
  if (q) where.summary = { contains: q };

  const rows = await prisma.issue.findMany({ where, take: 100, orderBy: { lastUpdated: "desc" } as any });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const { projectId, summary, description } = body;
  if (!projectId || !summary) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  if (!canViewProject(session, projectId)) return NextResponse.json({ ok: false }, { status: 403 });

  // Create text row first (mantis_bug_text_table), then issue row
  const text = await prisma.issueText.create({
    data: { description, stepsToReproduce: "", additionalInfo: "" } as any
  });

  const issue = await prisma.issue.create({
    data: {
      projectId,
      reporterId: session.uid,
      handlerId: null,
      priority: 30,
      severity: 50,
      status: 10,
      resolution: 10,
      categoryId: null,
      dateSubmitted: Math.floor(Date.now() / 1000),
      lastUpdated: Math.floor(Date.now() / 1000),
      bugTextId: (text as any).id,
      summary
    } as any
  });

  return NextResponse.json(issue, { status: 201 });
}
