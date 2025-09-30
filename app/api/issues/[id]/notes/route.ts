export const dynamic = "force-dynamic";

// /app/api/issues/[id]/notes/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canViewProject, canComment } from "@/lib/permissions";
import { notifyIssueAction } from "@/lib/notify/issue-notifications";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const bugId = parseInt(params.id, 10);

  // Verify issue exists and user has access
  const issue = await prisma.mantis_bug_table.findUnique({ where: { id: bugId } });
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (!(await canViewProject(session, issue.project_id))) return NextResponse.json({ error: "Access denied" }, { status: 403 });

  // Get all notes for this issue
  const notes = await prisma.mantis_bugnote_table.findMany({
    where: { bug_id: bugId },
    orderBy: { date_submitted: "asc" }
  });

  // Get text and reporter for each note
  const notesWithText = await Promise.all(
    notes.map(async (note) => {
      const text = await prisma.mantis_bugnote_text_table.findUnique({
        where: { id: note.bugnote_text_id }
      });
      const reporter = await prisma.mantis_user_table.findUnique({
        where: { id: note.reporter_id },
        select: { username: true, realname: true }
      });
      return {
        ...note,
        text: text?.note ?? "",
        reporter: reporter?.realname || reporter?.username || "Unknown"
      };
    })
  );

  return NextResponse.json(notesWithText);
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const bugId = parseInt(params.id, 10);
  const { note } = await req.json();

  if (!note || note.trim() === "") {
    return NextResponse.json({ error: "Note text is required" }, { status: 400 });
  }

  const issue = await prisma.mantis_bug_table.findUnique({ where: { id: bugId } });
  if (!issue) return NextResponse.json({ ok: false }, { status: 404 });
  if (!(await canComment(session, issue.project_id))) return NextResponse.json({ ok: false }, { status: 403 });

  // Create note text first
  const noteText = await prisma.mantis_bugnote_text_table.create({
    data: { note: note.trim() }
  });

  // Create the note
  const bn = await prisma.mantis_bugnote_table.create({
    data: {
      bug_id: bugId,
      reporter_id: session.uid,
      bugnote_text_id: noteText.id,
      date_submitted: Math.floor(Date.now() / 1000),
      last_modified: Math.floor(Date.now() / 1000),
      view_state: 10, // Public
      note_type: 0,
      note_attr: ""
    }
  });

  // Update issue last_updated timestamp
  await prisma.mantis_bug_table.update({
    where: { id: bugId },
    data: { last_updated: Math.floor(Date.now() / 1000) }
  });

  // Send notifications for note creation
  const baseUrl = new URL(req.url).origin;
  await notifyIssueAction({
    issueId: issue.id,
    issueSummary: issue.summary,
    projectId: issue.project_id,
    action: "commented",
    actorId: session.uid,
    actorName: session.username,
    changes: "New comment added"
  }, baseUrl);

  return NextResponse.json({ ...bn, text: note.trim() }, { status: 201 });
}
