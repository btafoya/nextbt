export const dynamic = "force-dynamic";

// /app/api/profile/password/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";
import { verifyMantisPassword, hashMantisPassword } from "@/lib/mantis-crypto";
import { logger } from "@/lib/logger";

/**
 * PUT /api/profile/password
 * Change current user's password
 */
export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Get current user with password
    const user = await prisma.mantis_user_table.findUnique({
      where: { id: session.uid },
      select: {
        id: true,
        username: true,
        password: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = await verifyMantisPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 401 }
      );
    }

    // Hash new password
    const newHash = await hashMantisPassword(newPassword);

    // Update password
    await prisma.mantis_user_table.update({
      where: { id: session.uid },
      data: {
        password: newHash,
      }
    });

    logger.info(`User ${session.username} changed password`);
    return NextResponse.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    logger.error("Change password error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to change password" },
      { status: err instanceof Error && err.message.includes("authenticated") ? 401 : 500 }
    );
  }
}