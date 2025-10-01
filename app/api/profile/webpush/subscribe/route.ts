// /app/api/profile/webpush/subscribe/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { subscribeWebPush } from "@/lib/notify/webpush";

/**
 * POST /api/profile/webpush/subscribe - Subscribe to web push notifications
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const { endpoint, keys } = body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json(
        { error: "Invalid subscription data" },
        { status: 400 }
      );
    }

    // Get user agent and IP from headers
    const userAgent = request.headers.get("user-agent") || undefined;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      undefined;

    await subscribeWebPush(
      session.uid,
      { endpoint, keys },
      userAgent,
      ip
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to subscribe to web push" },
      { status: 500 }
    );
  }
}
