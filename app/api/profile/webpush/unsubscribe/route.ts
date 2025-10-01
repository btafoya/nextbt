// /app/api/profile/webpush/unsubscribe/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { unsubscribeWebPush } from "@/lib/notify/webpush";

/**
 * POST /api/profile/webpush/unsubscribe - Unsubscribe from web push
 */
export async function POST(request: Request) {
  try {
    await requireSession();
    const body = await request.json();

    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Endpoint is required" },
        { status: 400 }
      );
    }

    await unsubscribeWebPush(endpoint);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to unsubscribe from web push" },
      { status: 500 }
    );
  }
}
