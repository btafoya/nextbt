export const dynamic = "force-dynamic";

// /app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/db/client";
import { createHash } from "crypto";
import { logger } from "@/lib/logger";

// GET /api/users/[id] - Get single user (admin only)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin();

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const user = await prisma.mantis_user_table.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        realname: true,
        email: true,
        enabled: true,
        protected: true,
        access_level: true,
        date_created: true,
        last_visit: true,
        login_count: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (err) {
    logger.error("Get user error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: err instanceof Error && err.message === "Not authenticated" ? 401 : 403 }
    );
  }
}

// PUT /api/users/[id] - Update user (admin only)
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin();

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const body = await req.json();
    const { username, realname, email, password, access_level, enabled } = body;

    // Check if user exists
    const existing = await prisma.mantis_user_table.findUnique({
      where: { id: userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if trying to change username to one that's taken
    if (username && username !== existing.username) {
      const usernameExists = await prisma.mantis_user_table.findFirst({
        where: {
          username,
          id: { not: userId }
        }
      });

      if (usernameExists) {
        return NextResponse.json(
          { error: "Username already exists" },
          { status: 409 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (username) updateData.username = username;
    if (realname !== undefined) updateData.realname = realname;
    if (email) updateData.email = email;
    if (access_level !== undefined) updateData.access_level = access_level;
    if (enabled !== undefined) updateData.enabled = enabled ? 1 : 0;

    // Hash password if provided
    if (password) {
      updateData.password = createHash("md5").update(password).digest("hex");
    }

    // Update user
    const user = await prisma.mantis_user_table.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        realname: true,
        email: true,
        enabled: true,
        access_level: true,
        date_created: true,
      }
    });

    return NextResponse.json(user);
  } catch (err) {
    logger.error("Update user error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin();

    const userId = parseInt(params.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.mantis_user_table.findUnique({
      where: { id: userId },
      select: { id: true, protected: true }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent deleting protected users
    if (user.protected === 1) {
      return NextResponse.json(
        { error: "Cannot delete protected user" },
        { status: 403 }
      );
    }

    // Delete user
    await prisma.mantis_user_table.delete({
      where: { id: userId }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error("Delete user error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}