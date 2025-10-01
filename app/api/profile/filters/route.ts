// /app/api/profile/filters/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getUserNotificationFilters,
  createNotificationFilter,
  getUserFilterStats,
} from "@/lib/notify/filters";

/**
 * GET /api/profile/filters - Get user's notification filters
 */
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId")
      ? parseInt(searchParams.get("projectId")!)
      : undefined;

    const filters = await getUserNotificationFilters(session.uid, projectId);

    return NextResponse.json({
      count: filters.length,
      filters,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get notification filters" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/filters - Create notification filter
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const {
      projectId,
      enabled,
      filterType,
      filterValue,
      action,
      channels,
    } = body;

    // Validate required fields
    if (!filterType || !filterValue || !action) {
      return NextResponse.json(
        { error: "filterType, filterValue, and action are required" },
        { status: 400 }
      );
    }

    // Validate filter type
    const validTypes = ["category", "priority", "severity", "tag", "project", "custom"];
    if (!validTypes.includes(filterType)) {
      return NextResponse.json(
        { error: "Invalid filter type" },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ["notify", "ignore", "digest_only"];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      );
    }

    const filterId = await createNotificationFilter({
      userId: session.uid,
      projectId: projectId || 0,
      enabled: enabled !== false,
      filterType,
      filterValue,
      action,
      channels: channels || [],
    });

    return NextResponse.json({ success: true, filterId });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to create notification filter" },
      { status: 500 }
    );
  }
}
