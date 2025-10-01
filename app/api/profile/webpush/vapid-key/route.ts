// /app/api/profile/webpush/vapid-key/route.ts
import { NextResponse } from "next/server";
import { secrets } from "@/config/secrets";

/**
 * GET /api/profile/webpush/vapid-key - Get VAPID public key for client subscription
 */
export async function GET() {
  try {
    if (!secrets.webPushEnabled || !secrets.vapidPublicKey) {
      return NextResponse.json(
        { error: "Web push is not enabled" },
        { status: 503 }
      );
    }

    return NextResponse.json({
      publicKey: secrets.vapidPublicKey,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get VAPID public key" },
      { status: 500 }
    );
  }
}
