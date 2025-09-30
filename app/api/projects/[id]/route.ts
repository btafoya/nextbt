// /app/api/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/db/client";

// Disable caching for all API responses
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/projects/[id] - Get single project (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin();

    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const project = await prisma.mantis_project_table.findUnique({
      where: { id: projectId },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                realname: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (err) {
    console.error("Get project error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: err instanceof Error && err.message === "Not authenticated" ? 401 : 403 }
    );
  }
}

// PUT /api/projects/[id] - Update project (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin();

    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    const body = await req.json();
    const { name, description, enabled, status, view_state, access_min, user_ids } = body;

    // Check if project exists
    const existing = await prisma.mantis_project_table.findUnique({
      where: { id: projectId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check if trying to change name to one that's taken
    if (name && name !== existing.name) {
      const nameExists = await prisma.mantis_project_table.findFirst({
        where: {
          name,
          id: { not: projectId }
        }
      });

      if (nameExists) {
        return NextResponse.json(
          { error: "Project name already exists" },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (enabled !== undefined) updateData.enabled = enabled ? 1 : 0;
    if (status !== undefined) updateData.status = status;
    if (view_state !== undefined) updateData.view_state = view_state;
    if (access_min !== undefined) updateData.access_min = access_min;

    // Update project
    await prisma.mantis_project_table.update({
      where: { id: projectId },
      data: updateData,
    });

    // Update user assignments if provided
    if (user_ids !== undefined && Array.isArray(user_ids)) {
      // Delete all existing assignments
      await prisma.mantis_project_user_list_table.deleteMany({
        where: { project_id: projectId }
      });

      // Add new assignments
      if (user_ids.length > 0) {
        await prisma.mantis_project_user_list_table.createMany({
          data: user_ids.map((userId: number) => ({
            project_id: projectId,
            user_id: userId,
            access_level: 10,
          }))
        });
      }
    }

    // Fetch updated project with users
    const updatedProject = await prisma.mantis_project_table.findUnique({
      where: { id: projectId },
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

    // Revalidate affected pages
    revalidatePath('/projects');
    revalidatePath(`/projects/${projectId}`);
    revalidatePath('/');

    return NextResponse.json(updatedProject);
  } catch (err) {
    console.error("Update project error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete project (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin();

    const projectId = parseInt(params.id, 10);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 });
    }

    // Check if project exists
    const project = await prisma.mantis_project_table.findUnique({
      where: { id: projectId },
      select: { id: true }
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Delete user assignments first
    await prisma.mantis_project_user_list_table.deleteMany({
      where: { project_id: projectId }
    });

    // Delete project
    await prisma.mantis_project_table.delete({
      where: { id: projectId }
    });

    // Revalidate projects list page
    revalidatePath('/projects');
    revalidatePath('/');

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete project error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
