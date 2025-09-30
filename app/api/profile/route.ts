export const dynamic = "force-dynamic";

// /app/api/profile/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

/**
 * GET /api/profile
 * Get current user's profile information
 */
export async function GET() {
  try {
    const session = await requireSession();

    const user = await prisma.mantis_user_table.findUnique({
      where: { id: session.uid },
      select: {
        id: true,
        username: true,
        realname: true,
        email: true,
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (err) {
    logger.error("Get profile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: err instanceof Error && err.message.includes("authenticated") ? 401 : 500 }
    );
  }
}

/**
 * PUT /api/profile
 * Update current user's profile information (realname, email)
 */
export async function PUT(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();
    const { realname, email } = body;

    // Validate input
    if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Update user profile
    const updated = await prisma.mantis_user_table.update({
      where: { id: session.uid },
      data: {
        realname: realname || "",
        email: email || "",
      },
      select: {
        id: true,
        username: true,
        realname: true,
        email: true,
      }
    });

    logger.info(`User ${session.username} updated profile`);
    return NextResponse.json(updated);
  } catch (err) {
    logger.error("Update profile error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update profile" },
      { status: err instanceof Error && err.message.includes("authenticated") ? 401 : 500 }
    );
  }
}