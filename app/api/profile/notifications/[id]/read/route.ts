// /app/api/profile/notifications/[id]/read/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { markNotificationAsRead } from "@/lib/notify/history";

/**
 * PATCH /api/profile/notifications/:id/read - Mark notification as read
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession();
    const notificationId = parseInt(params.id);

    if (isNaN(notificationId)) {
      return NextResponse.json(
        { error: "Invalid notification ID" },
        { status: 400 }
      );
    }

    await markNotificationAsRead(notificationId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to mark notification as read" },
      { status: 500 }
    );
  }
}
