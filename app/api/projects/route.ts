// /app/api/projects/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/db/client";

// GET /api/projects - List all projects (admin only)
export async function GET() {
  try {
    requireAdmin();

    const projects = await prisma.mantis_project_table.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        enabled: true,
        view_state: true,
        description: true,
        users: {
          select: {
            user_id: true,
            access_level: true,
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(projects);
  } catch (err) {
    console.error("List projects error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: err instanceof Error && err.message === "Not authenticated" ? 401 : 403 }
    );
  }
}

// POST /api/projects - Create new project (admin only)
export async function POST(req: Request) {
  try {
    requireAdmin();

    const body = await req.json();
    const { name, description, enabled, status, view_state, access_min, user_ids } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    // Check if project name already exists
    const existing = await prisma.mantis_project_table.findFirst({
      where: { name }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Project name already exists" },
        { status: 409 }
      );
    }

    // Create project with category_id: 0 (will update after creating default category)
    const project = await prisma.mantis_project_table.create({
      data: {
        name,
        description: description || "",
        enabled: enabled !== undefined ? (enabled ? 1 : 0) : 1,
        status: status || 10,
        view_state: view_state || 10,
        access_min: access_min || 10,
        file_path: "",
        category_id: 0, // Temporary: no category
        inherit_global: 0,
      }
    });

    // Create default "General" category for the new project
    const session = requireAdmin();
    const defaultCategory = await prisma.mantis_category_table.create({
      data: {
        project_id: project.id,
        user_id: session.uid,
        name: "General",
        status: 1,
      }
    });

    // Update project to reference the new default category
    await prisma.mantis_project_table.update({
      where: { id: project.id },
      data: { category_id: defaultCategory.id }
    });

    // Add user assignments if provided
    if (user_ids && Array.isArray(user_ids) && user_ids.length > 0) {
      await prisma.mantis_project_user_list_table.createMany({
        data: user_ids.map((userId: number) => ({
          project_id: project.id,
          user_id: userId,
          access_level: 10,
        }))
      });
    }

    // Fetch complete project with users
    const completeProject = await prisma.mantis_project_table.findUnique({
      where: { id: project.id },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realname: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(completeProject, { status: 201 });
  } catch (err) {
    console.error("Create project error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
