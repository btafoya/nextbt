// /app/api/notifications/sync/route.ts
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { syncMantisNotificationsToHistory } from "@/lib/notify/sync-mantis-notifications";
import { logger } from "@/lib/logger";

export async function POST() {
  try {
    await requireAdmin();

    const count = await syncMantisNotificationsToHistory();

    return NextResponse.json({
      success: true,
      synced: count,
      message: `Synced ${count} notifications to history`,
    });
  } catch (error) {
    logger.error("Error syncing notifications:", error);
    return NextResponse.json(
      { error: "Failed to sync notifications" },
      { status: 500 }
    );
  }
}
