// /app/api/cron/process-digests/route.ts
import { NextResponse } from "next/server";
import { processPendingDigests } from "@/lib/notify/digest";
import { logger } from "@/lib/logger";

/**
 * POST /api/cron/process-digests - Process pending notification digests
 *
 * This endpoint should be called by a cron job hourly:
 * 0 * * * * curl -X POST https://yourdomain.com/api/cron/process-digests
 *
 * Or use the Authorization header for security:
 * 0 * * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/process-digests
 */
export async function POST(request: Request) {
  try {
    // Optional: Add cron job authentication
    // const authHeader = request.headers.get("authorization");
    // const cronSecret = process.env.CRON_SECRET;
    // if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    logger.log("[Cron] Starting digest processing...");

    await processPendingDigests();

    logger.log("[Cron] Digest processing completed successfully");

    return NextResponse.json({
      success: true,
      message: "Digest processing completed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("[Cron] Digest processing failed:", error);
    return NextResponse.json(
      { error: "Failed to process digests" },
      { status: 500 }
    );
  }
}
