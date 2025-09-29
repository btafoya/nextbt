// /app/api/issues/[id]/notes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canComment } from "@/lib/permissions";

type Ctx = { params: { id: string } };

export async function POST(req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const bugId = parseInt(params.id, 10);
  const { note } = await req.json();

  const issue = await prisma.issue.findUnique({ where: { id: bugId } as any });
  if (!issue) return NextResponse.json({ ok: false }, { status: 404 });
  if (!canComment(session, (issue as any).projectId)) return NextResponse.json({ ok: false }, { status: 403 });

  const noteText = await prisma.issueNoteText.create({ data: { note } as any });
  const bn = await prisma.issueNote.create({
    data: {
      bugId,
      reporter: session.uid,
      viewState: 10,
      dateSubmitted: Math.floor(Date.now() / 1000),
      lastModified: Math.floor(Date.now() / 1000),
      noteTextId: (noteText as any).id
    } as any
  });

  return NextResponse.json(bn, { status: 201 });
}
