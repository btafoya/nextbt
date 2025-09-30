// /app/api/users/assignable/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

/**
 * GET /api/users/assignable
 * Returns list of users who can be assigned to issues
 * Accessible to all authenticated users
 */
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const projectIdParam = searchParams.get("projectId");

    let users;

    if (projectIdParam) {
      // Get users specifically for a project
      const projectId = parseInt(projectIdParam, 10);

      // Get project members
      const members = await prisma.mantis_project_user_list_table.findMany({
        where: { project_id: projectId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              realname: true,
              enabled: true,
              access_level: true,
            }
          }
        }
      });

      // Get administrators (access_level >= 90)
      const admins = await prisma.mantis_user_table.findMany({
        where: {
          enabled: 1,
          access_level: { gte: 90 }
        },
        select: {
          id: true,
          username: true,
          realname: true,
          enabled: true,
        }
      });

      // Combine project members and admins
      const projectUsers = members
        .filter(m => m.user.enabled === 1)
        .map(m => ({
          id: m.user.id,
          username: m.user.username,
          realname: m.user.realname || m.user.username,
        }));

      const adminUsers = admins.map(a => ({
        id: a.id,
        username: a.username,
        realname: a.realname || a.username,
      }));

      users = [...projectUsers, ...adminUsers];
    } else {
      // Get all enabled users across projects the current user has access to
      const userProjects = await prisma.mantis_project_user_list_table.findMany({
        where: {
          project_id: { in: session.projects }
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              realname: true,
              enabled: true,
            }
          }
        },
        distinct: ['user_id']
      });

      users = userProjects
        .filter(p => p.user.enabled === 1)
        .map(p => ({
          id: p.user.id,
          username: p.user.username,
          realname: p.user.realname || p.user.username,
        }));
    }

    // Remove duplicates and sort
    const uniqueUsers = Array.from(
      new Map(users.map(u => [u.id, u])).values()
    ).sort((a, b) => a.realname.localeCompare(b.realname));

    return NextResponse.json(uniqueUsers);
  } catch (err) {
    logger.error("Get assignable users error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: err instanceof Error && err.message.includes("authenticated") ? 401 : 500 }
    );
  }
}