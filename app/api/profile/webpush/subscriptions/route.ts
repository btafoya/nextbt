// /app/api/profile/webpush/subscriptions/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserWebPushSubscriptions } from "@/lib/notify/webpush";

/**
 * GET /api/profile/webpush/subscriptions - Get user's web push subscriptions
 */
export async function GET() {
  try {
    const session = await requireSession();
    const subscriptions = await getUserWebPushSubscriptions(session.uid);

    return NextResponse.json({
      count: subscriptions.length,
      subscriptions: subscriptions.map((s) => ({
        id: s.id,
        endpoint: s.endpoint.substring(0, 50) + "...", // Truncate for security
        userAgent: s.user_agent,
        enabled: s.enabled === 1,
        dateCreated: s.date_created,
        dateLastUsed: s.date_last_used,
      })),
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get subscriptions" },
      { status: 500 }
    );
  }
}
