// /app/api/projects/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { getSession, requireSession } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const projects = await prisma.mantis_project_table.findMany({
    where: {
      id: { in: session.projects }
    },
    select: {
      id: true,
      name: true
    },
    orderBy: { name: "asc" }
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  try {
    const session = requireSession();

    // Check if user is admin (access_level >= 90)
    const user = await prisma.mantis_user_table.findUnique({
      where: { id: session.uid }
    });

    if (!user || user.access_level < 90) {
      return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const { name, description, status, enabled, view_state } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }

    const project = await prisma.mantis_project_table.create({
      data: {
        name: name.trim(),
        status: status || 10,
        enabled: enabled !== false,
        view_state: view_state || 10,
        description: description || "",
        category_id: 1,
        inherit_global: true,
        file_path: "",
        access_min: 10
      }
    });

    // Grant manager access to the creator
    await prisma.mantis_project_user_list_table.create({
      data: {
        project_id: project.id,
        user_id: session.uid,
        access_level: 90
      }
    });

    return NextResponse.json(project, { status: 201 });
  } catch (err: any) {
    console.error("Project creation error:", err);
    return NextResponse.json({ error: err.message || "Failed to create project" }, { status: 500 });
  }
}