export const dynamic = "force-dynamic";

// /app/api/user-activity/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const actionType = searchParams.get("action_type") || undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      user_id: session.uid,
    };

    if (actionType) {
      where.action_type = actionType;
    }

    // Get activity logs
    const [activities, total] = await Promise.all([
      prisma.mantis_user_activity_log_table.findMany({
        where,
        orderBy: { date_created: "desc" },
        skip,
        take: limit,
      }),
      prisma.mantis_user_activity_log_table.count({ where }),
    ]);

    return NextResponse.json({
      data: activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    logger.error("Get user activity error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch activity" },
      { status: err instanceof Error && err.message.includes("authenticated") ? 401 : 500 }
    );
  }
}
