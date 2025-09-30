// /app/api/issues/[id]/attachments/[fileId]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canViewProject, getProjectAccessLevel } from "@/lib/permissions";

type Ctx = { params: { id: string; fileId: string } };

export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const fileId = parseInt(params.fileId, 10);

  // Get the attachment
  const file = await prisma.mantis_bug_file_table.findUnique({ where: { id: fileId } });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  // Verify user has access to the issue
  const issue = await prisma.mantis_bug_table.findUnique({ where: { id: file.bug_id } });
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (!(await canViewProject(session, issue.project_id))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Return file content from database
  if (!file.content) {
    return NextResponse.json({ error: "File content not found" }, { status: 404 });
  }

  return new Response(new Uint8Array(file.content), {
    headers: {
      "Content-Type": file.file_type || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${file.filename}"`,
      "Content-Length": file.filesize.toString()
    }
  });
}

export async function DELETE(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const fileId = parseInt(params.fileId, 10);

  // Get the attachment
  const file = await prisma.mantis_bug_file_table.findUnique({ where: { id: fileId } });
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  // Verify user has access to the issue
  const issue = await prisma.mantis_bug_table.findUnique({ where: { id: file.bug_id } });
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (!(await canViewProject(session, issue.project_id))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Check permissions - managers can delete any attachment, users can delete their own
  const accessLevel = await getProjectAccessLevel(session.uid, issue.project_id);
  if (accessLevel < 70 && file.user_id !== session.uid) {
    return NextResponse.json({ error: "You can only delete your own attachments" }, { status: 403 });
  }

  // Delete the attachment from database
  await prisma.mantis_bug_file_table.delete({ where: { id: fileId } });

  // Update issue last_updated
  await prisma.mantis_bug_table.update({
    where: { id: file.bug_id },
    data: { last_updated: Math.floor(Date.now() / 1000) }
  });

  return NextResponse.json({ ok: true });
}