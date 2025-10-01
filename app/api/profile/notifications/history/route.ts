// /app/api/profile/notifications/history/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getUserNotificationHistory,
  getUserNotificationStats,
} from "@/lib/notify/history";

/**
 * GET /api/profile/notifications/history - Get user's notification history
 */
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const eventType = searchParams.get("eventType") || undefined;
    const bugId = searchParams.get("bugId")
      ? parseInt(searchParams.get("bugId")!)
      : undefined;

    const history = await getUserNotificationHistory(session.uid, {
      limit,
      offset,
      unreadOnly,
      eventType,
      bugId,
    });

    return NextResponse.json({
      count: history.length,
      limit,
      offset,
      notifications: history,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get notification history" },
      { status: 500 }
    );
  }
}
