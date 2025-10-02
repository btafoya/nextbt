// /lib/notify/sync-mantis-notifications.ts
import "server-only";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

/**
 * Sync MantisBT notification queue (sent notifications) to notification history table
 * This allows MantisBT-sent emails to appear in NextBT history UI
 */
export async function syncMantisNotificationsToHistory(): Promise<number> {
  try {
    // Find all sent notifications that haven't been synced to history yet
    const sentNotifications = await prisma.mantis_notification_queue_table.findMany({
      where: {
        status: "sent",
        date_sent: { not: null },
      },
      orderBy: { date_sent: "desc" },
      take: 100, // Process in batches
    });

    if (sentNotifications.length === 0) {
      return 0;
    }

    logger.log(`Syncing ${sentNotifications.length} MantisBT notifications to history`);

    // Check which ones already exist in history (to avoid duplicates)
    const existingHistoryIds = new Set(
      (
        await prisma.mantis_notification_history_table.findMany({
          where: {
            user_id: { in: sentNotifications.map((n) => n.user_id) },
            bug_id: { in: sentNotifications.map((n) => n.bug_id) },
            date_sent: { in: sentNotifications.map((n) => n.date_sent || 0) },
          },
          select: { user_id: true, bug_id: true, date_sent: true },
        })
      ).map((h) => `${h.user_id}_${h.bug_id}_${h.date_sent}`)
    );

    // Filter out duplicates
    const newNotifications = sentNotifications.filter(
      (n) => !existingHistoryIds.has(`${n.user_id}_${n.bug_id}_${n.date_sent}`)
    );

    if (newNotifications.length === 0) {
      logger.log("No new notifications to sync (all already in history)");
      return 0;
    }

    // Create history entries
    await prisma.mantis_notification_history_table.createMany({
      data: newNotifications.map((n) => ({
        user_id: n.user_id,
        bug_id: n.bug_id,
        event_type: n.event_type,
        subject: n.subject,
        body: n.body,
        channels_sent: ["email"], // MantisBT only sends email
        read_status: 0,
        date_sent: n.date_sent || n.date_created,
      })),
      skipDuplicates: true,
    });

    logger.log(`Successfully synced ${newNotifications.length} notifications to history`);
    return newNotifications.length;
  } catch (error) {
    logger.error("Failed to sync MantisBT notifications to history:", error);
    throw error;
  }
}

/**
 * Mark MantisBT queue entries as synced by updating their status
 * (optional - only if you want to track synced notifications)
 */
export async function markQueueAsSynced(queueIds: number[]): Promise<void> {
  // Note: MantisBT doesn't have a "synced" status, so we'll leave them as "sent"
  // This is fine - we use duplicate detection above
}
