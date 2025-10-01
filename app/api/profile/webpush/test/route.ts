// /app/api/profile/webpush/test/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { testWebPush } from "@/lib/notify/webpush";

/**
 * POST /api/profile/webpush/test - Send test web push notification
 */
export async function POST() {
  try {
    const session = await requireSession();
    await testWebPush(session.uid);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
