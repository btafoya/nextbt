export const dynamic = "force-dynamic";

// /app/api/issues/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canViewProject, canEditIssue, canDeleteIssue } from "@/lib/permissions";
import { notifyIssueAction } from "@/lib/notify/issue-notifications";
import { secrets } from "@/config/secrets";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseInt(params.id, 10);
  const row = await prisma.mantis_bug_table.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  if (!(await canViewProject(session, row.project_id))) return NextResponse.json({ ok: false }, { status: 403 });

  const text = await prisma.mantis_bug_text_table.findUnique({ where: { id: row.bug_text_id } });

  return NextResponse.json({ ...row, text });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseInt(params.id, 10);
  const body = await req.json();

  const row = await prisma.mantis_bug_table.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  if (!(await canViewProject(session, row.project_id))) return NextResponse.json({ ok: false }, { status: 403 });

  // Check if user can edit this issue
  if (!(await canEditIssue(session, row))) {
    return NextResponse.json({ error: "You don't have permission to edit this issue" }, { status: 403 });
  }

  // Update text if description is provided
  if (body.description !== undefined) {
    await prisma.mantis_bug_text_table.update({
      where: { id: row.bug_text_id },
      data: { description: body.description }
    });
  }

  // Build update data with proper field mapping
  const updateData: any = {
    last_updated: Math.floor(Date.now() / 1000)
  };

  if (body.projectId !== undefined) updateData.project_id = body.projectId;
  if (body.summary !== undefined) updateData.summary = body.summary;
  if (body.status !== undefined) updateData.status = body.status;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.severity !== undefined) updateData.severity = body.severity;
  if (body.reproducibility !== undefined) updateData.reproducibility = body.reproducibility;
  if (body.handler_id !== undefined) updateData.handler_id = body.handler_id || 0;

  const updated = await prisma.mantis_bug_table.update({
    where: { id },
    data: updateData
  });

  // Log history for each changed field
  const timestamp = Math.floor(Date.now() / 1000);
  const historyEntries: any[] = [];

  if (body.status !== undefined && body.status !== row.status) {
    historyEntries.push({
      user_id: session.uid,
      bug_id: id,
      field_name: "status",
      old_value: String(row.status),
      new_value: String(body.status),
      type: 0,
      date_modified: timestamp
    });
  }

  if (body.priority !== undefined && body.priority !== row.priority) {
    historyEntries.push({
      user_id: session.uid,
      bug_id: id,
      field_name: "priority",
      old_value: String(row.priority),
      new_value: String(body.priority),
      type: 0,
      date_modified: timestamp
    });
  }

  if (body.severity !== undefined && body.severity !== row.severity) {
    historyEntries.push({
      user_id: session.uid,
      bug_id: id,
      field_name: "severity",
      old_value: String(row.severity),
      new_value: String(body.severity),
      type: 0,
      date_modified: timestamp
    });
  }

  if (body.handler_id !== undefined && body.handler_id !== row.handler_id) {
    historyEntries.push({
      user_id: session.uid,
      bug_id: id,
      field_name: "handler_id",
      old_value: String(row.handler_id),
      new_value: String(body.handler_id || 0),
      type: 0,
      date_modified: timestamp
    });
  }

  if (body.summary !== undefined && body.summary !== row.summary) {
    historyEntries.push({
      user_id: session.uid,
      bug_id: id,
      field_name: "summary",
      old_value: row.summary,
      new_value: body.summary,
      type: 0,
      date_modified: timestamp
    });
  }

  if (body.reproducibility !== undefined && body.reproducibility !== row.reproducibility) {
    historyEntries.push({
      user_id: session.uid,
      bug_id: id,
      field_name: "reproducibility",
      old_value: String(row.reproducibility),
      new_value: String(body.reproducibility),
      type: 0,
      date_modified: timestamp
    });
  }

  // Write history entries to database
  if (historyEntries.length > 0) {
    await prisma.mantis_bug_history_table.createMany({
      data: historyEntries
    });
  }

  // Detect what changed for notification
  let changes: string | undefined;
  let action: "updated" | "status_changed" | "assigned" = "updated";

  if (body.status !== undefined && body.status !== row.status) {
    action = "status_changed";
    changes = `Status changed from ${row.status} to ${body.status}`;
  } else if (body.handler_id !== undefined && body.handler_id !== row.handler_id) {
    action = "assigned";
    changes = `Issue assigned`;
  }

  // Send notifications for issue update
  await notifyIssueAction({
    issueId: updated.id,
    issueSummary: updated.summary,
    projectId: updated.project_id,
    action,
    actorId: session.uid,
    actorName: session.username,
    changes
  }, secrets.baseUrl);

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const id = parseInt(params.id, 10);

  const row = await prisma.mantis_bug_table.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ ok: false }, { status: 404 });
  if (!(await canViewProject(session, row.project_id))) return NextResponse.json({ ok: false }, { status: 403 });

  // Check if user can delete this issue
  const canDelete = await canDeleteIssue(session, row);
  if (!canDelete) {
    return NextResponse.json({ error: "You don't have permission to delete this issue" }, { status: 403 });
  }

  // Send notifications before deletion
  await notifyIssueAction({
    issueId: row.id,
    issueSummary: row.summary,
    projectId: row.project_id,
    action: "deleted",
    actorId: session.uid,
    actorName: session.username
  }, secrets.baseUrl);

  // Delete associated records first
  await prisma.mantis_bugnote_table.deleteMany({ where: { bug_id: id } });
  await prisma.mantis_bug_file_table.deleteMany({ where: { bug_id: id } });
  await prisma.mantis_bug_table.delete({ where: { id } });
  await prisma.mantis_bug_text_table.delete({ where: { id: row.bug_text_id } });

  return NextResponse.json({ ok: true });
}
