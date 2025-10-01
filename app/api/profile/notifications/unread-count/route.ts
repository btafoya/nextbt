// /app/api/profile/notifications/unread-count/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUnreadNotificationCount } from "@/lib/notify/history";

/**
 * GET /api/profile/notifications/unread-count - Get unread notification count
 */
export async function GET() {
  try {
    const session = await requireSession();
    const count = await getUnreadNotificationCount(session.uid);

    return NextResponse.json({ count });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get unread count" },
      { status: 500 }
    );
  }
}
