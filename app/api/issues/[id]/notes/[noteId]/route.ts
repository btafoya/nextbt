// /app/api/issues/[id]/notes/[noteId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canViewProject, canEditNote, canDeleteNote } from "@/lib/permissions";

type Ctx = { params: { id: string; noteId: string } };

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const noteId = parseInt(params.noteId, 10);
  const { note } = await req.json();

  if (!note || note.trim() === "") {
    return NextResponse.json({ error: "Note text is required" }, { status: 400 });
  }

  // Get the note
  const bugnote = await prisma.mantis_bugnote_table.findUnique({ where: { id: noteId } });
  if (!bugnote) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  // Verify user has access to the issue
  const issue = await prisma.mantis_bug_table.findUnique({ where: { id: bugnote.bug_id } });
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (!(await canViewProject(session, issue.project_id))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Check if user can edit this note
  const canEdit = await canEditNote(session, bugnote);
  if (!canEdit) {
    return NextResponse.json({ error: "You can only edit your own notes" }, { status: 403 });
  }

  // Update note text
  await prisma.mantis_bugnote_text_table.update({
    where: { id: bugnote.bugnote_text_id },
    data: { note: note.trim() }
  });

  // Update note last_modified
  const updated = await prisma.mantis_bugnote_table.update({
    where: { id: noteId },
    data: { last_modified: Math.floor(Date.now() / 1000) }
  });

  // Update issue last_updated
  await prisma.mantis_bug_table.update({
    where: { id: bugnote.bug_id },
    data: { last_updated: Math.floor(Date.now() / 1000) }
  });

  return NextResponse.json({ ...updated, text: note.trim() });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const noteId = parseInt(params.noteId, 10);

  // Get the note
  const bugnote = await prisma.mantis_bugnote_table.findUnique({ where: { id: noteId } });
  if (!bugnote) return NextResponse.json({ error: "Note not found" }, { status: 404 });

  // Verify user has access to the issue
  const issue = await prisma.mantis_bug_table.findUnique({ where: { id: bugnote.bug_id } });
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (!(await canViewProject(session, issue.project_id))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Check if user can delete this note
  const canDelete = await canDeleteNote(session, bugnote, issue.project_id);
  if (!canDelete) {
    return NextResponse.json({ error: "You don't have permission to delete this note" }, { status: 403 });
  }

  // Delete note and text
  await prisma.mantis_bugnote_table.delete({ where: { id: noteId } });
  await prisma.mantis_bugnote_text_table.delete({ where: { id: bugnote.bugnote_text_id } });

  // Update issue last_updated
  await prisma.mantis_bug_table.update({
    where: { id: bugnote.bug_id },
    data: { last_updated: Math.floor(Date.now() / 1000) }
  });

  return NextResponse.json({ ok: true });
}