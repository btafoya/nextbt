// /app/api/profile/notifications/history/stats/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserNotificationStats } from "@/lib/notify/history";

/**
 * GET /api/profile/notifications/history/stats - Get notification statistics
 */
export async function GET() {
  try {
    const session = await requireSession();
    const stats = await getUserNotificationStats(session.uid);

    return NextResponse.json(stats);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get notification statistics" },
      { status: 500 }
    );
  }
}
