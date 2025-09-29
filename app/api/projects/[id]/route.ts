// /app/api/projects/[id]/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";

async function canManageProject(projectId: number, userId: number) {
  const user = await prisma.mantis_user_table.findUnique({
    where: { id: userId }
  });

  // Admins can manage any project
  if (user && user.access_level >= 90) return true;

  // Check project-specific manager/developer access
  const access = await prisma.mantis_project_user_list_table.findFirst({
    where: {
      project_id: projectId,
      user_id: userId,
      access_level: { gte: 70 } // Developer or Manager
    }
  });

  return !!access;
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const project = await prisma.mantis_project_table.findUnique({
      where: { id: projectId }
    });

    if (!project || !session.projects.includes(project.id)) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (err: any) {
    console.error("Project fetch error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch project" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const canManage = await canManageProject(projectId, session.uid);
    if (!canManage) {
      return NextResponse.json({ error: "Unauthorized: Manager/Admin access required" }, { status: 403 });
    }

    const { name, description, status, enabled, view_state } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await prisma.mantis_project_table.update({
      where: { id: projectId },
      data: {
        name: name.trim(),
        status: status ?? 10,
        enabled: enabled !== false,
        view_state: view_state ?? 10,
        description: description || ""
      }
    });

    return NextResponse.json(project);
  } catch (err: any) {
    console.error("Project update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const projectId = parseInt(params.id, 10);

    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Only admins can delete projects
    const user = await prisma.mantis_user_table.findUnique({
      where: { id: session.uid }
    });

    if (!user || user.access_level < 90) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    // Delete project user associations first
    await prisma.mantis_project_user_list_table.deleteMany({
      where: { project_id: projectId }
    });

    // Delete the project
    await prisma.mantis_project_table.delete({
      where: { id: projectId }
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Project deletion error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete project" }, { status: 500 });
  }
}