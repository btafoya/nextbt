// /app/api/profile/digest/queue/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserQueuedNotifications } from "@/lib/notify/digest";

/**
 * GET /api/profile/digest/queue - Get user's queued notifications
 */
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const queued = await getUserQueuedNotifications(session.uid, status);

    return NextResponse.json({
      count: queued.length,
      notifications: queued.map((q) => ({
        id: q.id,
        bugId: q.bug_id,
        eventType: q.event_type,
        subject: q.subject,
        body: q.body,
        status: q.status,
        dateCreated: q.date_created,
        dateScheduled: q.date_scheduled,
        dateSent: q.date_sent,
      })),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get queued notifications" },
      { status: 500 }
    );
  }
}
