// /app/api/issues/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canViewProject, canEditIssue, canDeleteIssue } from "@/lib/permissions";
import { notifyIssueAction } from "@/lib/notify/issue-notifications";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseInt(params.id, 10);
  const row = await prisma.mantis_bug_table.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  if (!canViewProject(session, row.project_id)) return NextResponse.json({ ok: false }, { status: 403 });

  const text = await prisma.mantis_bug_text_table.findUnique({ where: { id: row.bug_text_id } });

  return NextResponse.json({ ...row, text });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseInt(params.id, 10);
  const payload = await req.json();

  const row = await prisma.mantis_bug_table.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  if (!canViewProject(session, row.project_id)) return NextResponse.json({ ok: false }, { status: 403 });

  // Check if user can edit this issue
  if (!canEditIssue(session, row)) {
    return NextResponse.json({ error: "You don't have permission to edit this issue" }, { status: 403 });
  }

  // Update text if description is provided
  if (payload.description !== undefined) {
    await prisma.mantis_bug_text_table.update({
      where: { id: row.bug_text_id },
      data: { description: payload.description }
    });
    delete payload.description;
  }

  const updated = await prisma.mantis_bug_table.update({
    where: { id },
    data: {
      ...payload,
      last_updated: Math.floor(Date.now() / 1000)
    }
  });

  // Detect what changed for notification
  let changes: string | undefined;
  let action: "updated" | "status_changed" | "assigned" = "updated";

  if (payload.status !== undefined && payload.status !== row.status) {
    action = "status_changed";
    changes = `Status changed from ${row.status} to ${payload.status}`;
  } else if (payload.handler_id !== undefined && payload.handler_id !== row.handler_id) {
    action = "assigned";
    changes = `Issue assigned`;
  }

  // Send notifications for issue update
  const baseUrl = new URL(req.url).origin;
  await notifyIssueAction({
    issueId: updated.id,
    issueSummary: updated.summary,
    projectId: updated.project_id,
    action,
    actorId: session.uid,
    actorName: session.username,
    changes
  }, baseUrl);

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseInt(params.id, 10);

  const row = await prisma.mantis_bug_table.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  if (!canViewProject(session, row.project_id)) return NextResponse.json({ ok: false }, { status: 403 });

  // Check if user can delete this issue
  const canDelete = await canDeleteIssue(session, row);
  if (!canDelete) {
    return NextResponse.json({ error: "You don't have permission to delete this issue" }, { status: 403 });
  }

  // Send notifications before deletion
  const baseUrl = new URL(req.url).origin;
  await notifyIssueAction({
    issueId: row.id,
    issueSummary: row.summary,
    projectId: row.project_id,
    action: "deleted",
    actorId: session.uid,
    actorName: session.username
  }, baseUrl);

  // Delete associated records first
  await prisma.mantis_bugnote_table.deleteMany({ where: { bug_id: id } });
  await prisma.mantis_bug_file_table.deleteMany({ where: { bug_id: id } });
  await prisma.mantis_bug_table.delete({ where: { id } });
  await prisma.mantis_bug_text_table.delete({ where: { id: row.bug_text_id } });

  return NextResponse.json({ ok: true });
}
