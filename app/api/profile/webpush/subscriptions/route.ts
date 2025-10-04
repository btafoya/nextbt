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
      subscriptions: subscriptions.map((s: any) => ({
        id: String(s.id),
        endpoint: s.endpoint,
        userAgent: s.user_agent || "Unknown",
        createdAt: new Date(s.date_created * 1000).toISOString(),
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
