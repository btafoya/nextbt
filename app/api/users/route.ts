export const dynamic = "force-dynamic";

// /app/api/users/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/db/client";
import { createHash } from "crypto";
import { logger } from "@/lib/logger";

// GET /api/users - List all users (admin only)
export async function GET() {
  try {
    requireAdmin();

    const users = await prisma.mantis_user_table.findMany({
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
      },
      orderBy: { username: 'asc' }
    });

    return NextResponse.json(users);
  } catch (err) {
    logger.error("List users error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: err instanceof Error && err.message === "Not authenticated" ? 401 : 403 }
    );
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(req: Request) {
  try {
    requireAdmin();

    const body = await req.json();
    const { username, realname, email, password, access_level, enabled } = body;

    // Validate required fields
    if (!username || !password || !email) {
      return NextResponse.json(
        { error: "Username, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existing = await prisma.mantis_user_table.findFirst({
      where: { username }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    // Hash password using MD5 (matching MantisBT default)
    const hashedPassword = createHash("md5").update(password).digest("hex");

    // Create user
    const user = await prisma.mantis_user_table.create({
      data: {
        username,
        realname: realname || "",
        email,
        password: hashedPassword,
        access_level: access_level || 10, // Default to Reporter (10)
        enabled: enabled !== undefined ? (enabled ? 1 : 0) : 1,
        protected: 0,
        date_created: Math.floor(Date.now() / 1000),
        last_visit: Math.floor(Date.now() / 1000),
        cookie_string: "",
        login_count: 0,
        lost_password_request_count: 0,
        failed_login_count: 0,
      },
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

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    logger.error("Create user error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}