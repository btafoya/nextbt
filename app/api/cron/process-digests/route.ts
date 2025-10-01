// app/api/cron/process-digests/route.ts
import { NextResponse } from "next/server";
import { processPendingDigests, cleanupOldDigests } from "@/lib/notify/digest";
import { logger } from "@/lib/logger";

const CRON_SECRET = process.env.NEXTBT_CRON_SECRET || "change-me-in-production";

/**
 * POST /api/cron/process-digests - Process pending notification digests
 *
 * Security: Requires X-Cron-Secret header matching NEXTBT_CRON_SECRET env var
 *
 * Called by cron job (e.g., every 15 minutes):
 * Run: node /path/to/scripts/process-digests.js
 */
export async function POST(request: Request) {
  try {
    // Verify cron secret for security
    const cronSecret = request.headers.get("X-Cron-Secret");

    if (cronSecret !== CRON_SECRET) {
      logger.error("Unauthorized cron request - invalid secret");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const startTime = Date.now();
    logger.log("🔄 Processing digests via cron...");

    // Process pending digests
    await processPendingDigests();

    // Clean up old digests (older than 30 days) - run at 2 AM
    const now = new Date();
    let cleaned = 0;

    if (now.getHours() === 2 && now.getMinutes() < 15) {
      logger.log("🧹 Cleaning up old digests...");
      cleaned = await cleanupOldDigests(30);
      logger.log(`✅ Cleaned up ${cleaned} old digest notifications`);
    }

    const duration = Date.now() - startTime;

    logger.log(`✅ Digest processing completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      duration,
      cleaned: cleaned > 0 ? cleaned : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error("❌ Digest processing failed:", error);

    return NextResponse.json(
      {
        error: "Digest processing failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
