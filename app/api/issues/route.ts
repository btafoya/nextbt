// /app/api/issues/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canViewProject } from "@/lib/permissions";
import { notifyIssueAction } from "@/lib/notify/issue-notifications";

export async function GET(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = parseInt(searchParams.get("projectId") ?? "0", 10) || undefined;
  const q = searchParams.get("q") ?? undefined;

  const where: any = {};
  if (projectId) {
    if (!(await canViewProject(session, projectId))) return NextResponse.json([], { status: 200 });
    where.project_id = projectId;
  } else {
    // Limit to user's projects
    where.project_id = { in: session.projects };
  }
  if (q) where.summary = { contains: q };

  const rows = await prisma.mantis_bug_table.findMany({ where, take: 100, orderBy: { last_updated: "desc" } });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const {
    projectId,
    summary,
    description,
    status,
    priority,
    severity,
    reproducibility,
    handler_id
  } = body;

  if (!projectId || !summary) return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  if (!(await canViewProject(session, projectId))) return NextResponse.json({ ok: false }, { status: 403 });

  // Create text row first (mantis_bug_text_table), then issue row
  const text = await prisma.mantis_bug_text_table.create({
    data: {
      description: description || "",
      steps_to_reproduce: "",
      additional_information: ""
    }
  });

  const issue = await prisma.mantis_bug_table.create({
    data: {
      project_id: projectId,
      reporter_id: session.uid,
      handler_id: handler_id || 0,
      priority: priority !== undefined ? priority : 30,
      severity: severity !== undefined ? severity : 50,
      reproducibility: reproducibility !== undefined ? reproducibility : 10,
      status: status !== undefined ? status : 10,
      resolution: 10,
      category_id: 1,
      date_submitted: Math.floor(Date.now() / 1000),
      last_updated: Math.floor(Date.now() / 1000),
      bug_text_id: text.id,
      summary
    }
  });

  // Send notifications for issue creation
  const baseUrl = new URL(req.url).origin;
  await notifyIssueAction({
    issueId: issue.id,
    issueSummary: issue.summary,
    projectId: issue.project_id,
    action: "created",
    actorId: session.uid,
    actorName: session.username
  }, baseUrl);

  return NextResponse.json(issue, { status: 201 });
}
