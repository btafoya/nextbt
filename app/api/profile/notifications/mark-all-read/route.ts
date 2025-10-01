// /app/api/profile/notifications/mark-all-read/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/lib/notify/history";

/**
 * POST /api/profile/notifications/mark-all-read - Mark all notifications as read
 */
export async function POST() {
  try {
    const session = await requireSession();
    const count = await markAllNotificationsAsRead(session.uid);

    return NextResponse.json({ success: true, count });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to mark all notifications as read" },
      { status: 500 }
    );
  }
}
