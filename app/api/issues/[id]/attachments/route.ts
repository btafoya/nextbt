export const dynamic = "force-dynamic";

// /app/api/issues/[id]/attachments/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession } from "@/lib/auth";
import { canViewProject, canComment } from "@/lib/permissions";
import { logger } from "@/lib/logger";

type Ctx = { params: { id: string } };

export async function GET(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const bugId = parseInt(params.id, 10);

  // Verify issue exists and user has access
  const issue = await prisma.mantis_bug_table.findUnique({ where: { id: bugId } });
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (!(await canViewProject(session, issue.project_id))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get all attachments for this issue
  const attachments = await prisma.mantis_bug_file_table.findMany({
    where: { bug_id: bugId },
    orderBy: { date_added: "desc" }
  });

  // Add uploader info to each attachment
  const attachmentsWithUser = await Promise.all(
    attachments.map(async (file) => {
      const uploader = await prisma.mantis_user_table.findUnique({
        where: { id: file.user_id },
        select: { username: true, realname: true }
      });
      return {
        ...file,
        uploader: uploader?.realname || uploader?.username || "Unknown"
      };
    })
  );

  return NextResponse.json(attachmentsWithUser);
}

export async function POST(req: Request, { params }: Ctx) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const bugId = parseInt(params.id, 10);

  // Verify issue exists and user has access
  const issue = await prisma.mantis_bug_table.findUnique({ where: { id: bugId } });
  if (!issue) return NextResponse.json({ error: "Issue not found" }, { status: 404 });
  if (!(await canComment(session, issue.project_id))) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create attachment record
    const attachment = await prisma.mantis_bug_file_table.create({
      data: {
        bug_id: bugId,
        user_id: session.uid,
        filename: file.name,
        file_type: file.type || "application/octet-stream",
        filesize: file.size,
        content: buffer,
        date_added: Math.floor(Date.now() / 1000),
        title: file.name,
        description: "",
        diskfile: "",
        folder: ""
      }
    });

    // Update issue last_updated
    await prisma.mantis_bug_table.update({
      where: { id: bugId },
      data: { last_updated: Math.floor(Date.now() / 1000) }
    });

    return NextResponse.json(attachment, { status: 201 });
  } catch (error: any) {
    logger.error("File upload error:", error);
    return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
  }
}