// /app/api/projects/route.ts
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";
import { apiResponse } from "@/lib/api-response";
import { logger } from "@/lib/logger";

// Disable caching for all API responses
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET /api/projects - List projects (all for admins, filtered for regular users)
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('active') === 'true';

    // Check if user is admin
    const user = await prisma.mantis_user_table.findUnique({
      where: { id: session.uid },
      select: { access_level: true }
    });

    const isAdmin = user && user.access_level >= 90;

    // Build where clause
    const where: any = {};

    // For activeOnly (new issue form), get current project assignments from database
    if (activeOnly) {
      // Query actual project assignments from database (not cached session)
      const userProjects = await prisma.mantis_project_user_list_table.findMany({
        where: { user_id: session.uid },
        select: { project_id: true }
      });
      const projectIds = userProjects.map(p => p.project_id);

      if (!isAdmin) {
        // Regular users see only their assigned projects
        where.id = { in: projectIds };
      } else {
        // Admins see all projects (no filter by assignment)
        // where remains empty to show all
      }

      // Filter for active projects
      where.enabled = 1;
      where.status = { in: [10, 30, 50] }; // development, release, stable (exclude obsolete)
    } else {
      // For project list page (non-active), use session cache
      if (!isAdmin) {
        where.id = { in: session.projects };
      }
    }

    const projects = await prisma.mantis_project_table.findMany({
      where,
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
      orderBy: { id: 'desc' }
    });

    return apiResponse(projects);
  } catch (err) {
    logger.error("List projects error:", err);
    const status = err instanceof Error && err.message === "Not authenticated" ? 401 : 500;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status }
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
    const session = await requireAdmin();
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

    // Revalidate projects list page
    revalidatePath('/projects');
    revalidatePath('/');

    return apiResponse(completeProject, { status: 201 });
  } catch (err) {
    logger.error("Create project error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
