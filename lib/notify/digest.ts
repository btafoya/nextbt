// /lib/notify/digest.ts
import "server-only";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/lib/notify/postmark";
import { sendWebPush } from "@/lib/notify/webpush";
import type { NotificationEventType } from "@/lib/notify/preference-checker";

export interface QueuedNotification {
  userId: number;
  bugId: number;
  eventType: NotificationEventType;
  severity: number;
  priority: number;
  categoryId: number;
  subject: string;
  body: string;
  htmlBody?: string;
  metadata?: Record<string, any>;
}

export interface DigestPreferences {
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly";
  timeOfDay: number; // 0-23
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  minNotifications: number;
  includeChannels: string[];
}

/**
 * Queue a notification for potential batching/digesting
 */
export async function queueNotification(notification: QueuedNotification): Promise<number> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const queued = await prisma.mantis_notification_queue_table.create({
      data: {
        user_id: notification.userId,
        bug_id: notification.bugId,
        event_type: notification.eventType,
        severity: notification.severity,
        priority: notification.priority,
        category_id: notification.categoryId,
        subject: notification.subject,
        body: notification.body,
        html_body: notification.htmlBody,
        metadata: notification.metadata || undefined,
        status: "pending",
        date_created: timestamp,
        date_scheduled: timestamp,
      },
    });

    logger.log(`Queued notification ${queued.id} for user ${notification.userId}`);
    return queued.id;
  } catch (error) {
    logger.error("Failed to queue notification:", error);
    throw error;
  }
}

/**
 * Queue multiple notifications in batch
 */
export async function queueNotificationsBatch(
  notifications: QueuedNotification[]
): Promise<number[]> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const result = await prisma.mantis_notification_queue_table.createMany({
      data: notifications.map((n) => ({
        user_id: n.userId,
        bug_id: n.bugId,
        event_type: n.eventType,
        severity: n.severity,
        priority: n.priority,
        category_id: n.categoryId,
        subject: n.subject,
        body: n.body,
        html_body: n.htmlBody,
        metadata: n.metadata || undefined,
        status: "pending",
        date_created: timestamp,
        date_scheduled: timestamp,
      })),
    });

    logger.log(`Queued ${result.count} notifications in batch`);
    return []; // createMany doesn't return IDs
  } catch (error) {
    logger.error("Failed to queue notifications batch:", error);
    throw error;
  }
}

/**
 * Get user's digest preferences
 */
export async function getDigestPreferences(userId: number): Promise<DigestPreferences | null> {
  const prefs = await prisma.mantis_digest_pref_table.findUnique({
    where: { user_id: userId },
  });

  if (!prefs) return null;

  return {
    enabled: prefs.enabled === 1,
    frequency: prefs.frequency as "hourly" | "daily" | "weekly",
    timeOfDay: prefs.time_of_day,
    dayOfWeek: prefs.day_of_week,
    minNotifications: prefs.min_notifications,
    includeChannels: (prefs.include_channels as string[]) || ["email"],
  };
}

/**
 * Update user's digest preferences
 */
export async function updateDigestPreferences(
  userId: number,
  prefs: Partial<DigestPreferences>
): Promise<void> {
  await prisma.mantis_digest_pref_table.upsert({
    where: { user_id: userId },
    create: {
      user_id: userId,
      enabled: prefs.enabled ? 1 : 0,
      frequency: prefs.frequency || "daily",
      time_of_day: prefs.timeOfDay || 9,
      day_of_week: prefs.dayOfWeek || 1,
      min_notifications: prefs.minNotifications || 1,
      include_channels: prefs.includeChannels || ["email"],
    },
    update: {
      enabled: prefs.enabled !== undefined ? (prefs.enabled ? 1 : 0) : undefined,
      frequency: prefs.frequency,
      time_of_day: prefs.timeOfDay,
      day_of_week: prefs.dayOfWeek,
      min_notifications: prefs.minNotifications,
      include_channels: prefs.includeChannels,
    },
  });

  logger.log(`Updated digest preferences for user ${userId}`);
}

/**
 * Process pending notifications for digest-eligible users
 */
export async function processPendingDigests(): Promise<void> {
  try {
    const now = Math.floor(Date.now() / 1000);

    // Get users with digest enabled and scheduled for processing
    const eligibleUsers = await prisma.mantis_digest_pref_table.findMany({
      where: {
        enabled: 1,
        OR: [
          { next_digest_scheduled: { lte: now } },
          { next_digest_scheduled: null },
        ],
      },
    });

    logger.log(`Found ${eligibleUsers.length} users eligible for digest processing`);

    for (const userPrefs of eligibleUsers) {
      await processUserDigest(userPrefs.user_id, userPrefs);
    }
  } catch (error) {
    logger.error("Failed to process pending digests:", error);
  }
}

/**
 * Process digest for a single user
 */
async function processUserDigest(
  userId: number,
  prefs: any
): Promise<void> {
  try {
    // Get pending notifications for this user
    const pending = await prisma.mantis_notification_queue_table.findMany({
      where: {
        user_id: userId,
        status: "pending",
      },
      orderBy: { date_created: "asc" },
    });

    if (pending.length < prefs.min_notifications) {
      logger.log(
        `User ${userId} has ${pending.length} notifications (minimum ${prefs.min_notifications}), skipping digest`
      );
      return;
    }

    // Generate batch ID
    const batchId = `digest_${userId}_${Date.now()}`;
    const timestamp = Math.floor(Date.now() / 1000);

    // Mark notifications as batched
    await prisma.mantis_notification_queue_table.updateMany({
      where: {
        user_id: userId,
        status: "pending",
      },
      data: {
        status: "batched",
        batch_id: batchId,
      },
    });

    // Generate digest email/message
    const digestContent = generateDigestContent(pending);

    // Get user email
    const user = await prisma.mantis_user_table.findUnique({
      where: { id: userId },
      select: { email: true, realname: true },
    });

    if (!user?.email) {
      logger.error(`User ${userId} has no email address for digest`);
      return;
    }

    // Send digest via configured channels
    const channels = prefs.include_channels
      ? (prefs.include_channels as string[])
      : ["email"];

    const sendPromises: Promise<any>[] = [];

    if (channels.includes("email")) {
      sendPromises.push(
        sendEmail(
          user.email,
          `Notification Digest - ${pending.length} updates`,
          digestContent.html
        )
      );
    }

    if (channels.includes("webpush")) {
      sendPromises.push(
        sendWebPushDigest(userId, digestContent.text, pending.length)
      );
    }

    await Promise.allSettled(sendPromises);

    // Update queue status to sent
    await prisma.mantis_notification_queue_table.updateMany({
      where: { batch_id: batchId },
      data: {
        status: "sent",
        date_sent: timestamp,
      },
    });

    // Update digest preferences with next scheduled time
    const nextScheduled = calculateNextDigestTime(
      prefs.frequency,
      prefs.time_of_day,
      prefs.day_of_week
    );

    await prisma.mantis_digest_pref_table.update({
      where: { user_id: userId },
      data: {
        last_digest_sent: timestamp,
        next_digest_scheduled: nextScheduled,
      },
    });

    logger.log(`Sent digest to user ${userId} with ${pending.length} notifications`);
  } catch (error) {
    logger.error(`Failed to process digest for user ${userId}:`, error);
  }
}

/**
 * Generate digest email HTML and text content
 */
function generateDigestContent(notifications: any[]): {
  html: string;
  text: string;
} {
  // Group notifications by issue
  const byIssue = new Map<number, any[]>();
  for (const notif of notifications) {
    if (!byIssue.has(notif.bug_id)) {
      byIssue.set(notif.bug_id, []);
    }
    byIssue.get(notif.bug_id)!.push(notif);
  }

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(to right, #2563eb, #1d4ed8); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
    .issue { background: #fff; padding: 16px; margin: 12px 0; border-left: 4px solid #2563eb; border-radius: 4px; }
    .issue-title { font-size: 16px; font-weight: 600; color: #1f2937; margin-bottom: 8px; }
    .notification { font-size: 14px; color: #6b7280; margin: 4px 0; padding-left: 12px; }
    .event-type { display: inline-block; background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; margin-right: 8px; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Notification Digest</h2>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">${notifications.length} updates from your projects</p>
    </div>
    <div class="content">
      ${Array.from(byIssue.entries())
        .map(
          ([bugId, notifs]) => `
        <div class="issue">
          <div class="issue-title">Issue #${bugId}</div>
          ${notifs
            .map(
              (n) => `
            <div class="notification">
              <span class="event-type">${n.event_type}</span>
              <span>${n.subject}</span>
            </div>
          `
            )
            .join("")}
        </div>
      `
        )
        .join("")}
      <div class="footer">
        <p>This is a notification digest from NextBT.</p>
        <p>You can manage your digest preferences in your profile settings.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Notification Digest - ${notifications.length} updates

${Array.from(byIssue.entries())
  .map(([bugId, notifs]) => {
    return `Issue #${bugId}:\n${notifs.map((n) => `  • [${n.event_type}] ${n.subject}`).join("\n")}`;
  })
  .join("\n\n")}

---
You can manage your digest preferences in your profile settings.
  `.trim();

  return { html, text };
}

/**
 * Send web push digest
 */
async function sendWebPushDigest(
  userId: number,
  message: string,
  count: number
): Promise<void> {
  try {
    await sendWebPush(userId, {
      title: `Notification Digest - ${count} updates`,
      body: message.split("\n").slice(0, 3).join("\n") + "...",
      icon: "/icon-192.png",
      badge: "/badge-72.png",
      data: { type: "digest", count },
    });
  } catch (error) {
    logger.error(`Failed to send web push digest to user ${userId}:`, error);
  }
}

/**
 * Calculate next digest time based on frequency
 */
function calculateNextDigestTime(
  frequency: string,
  timeOfDay: number,
  dayOfWeek: number
): number {
  const now = new Date();
  const next = new Date();

  if (frequency === "hourly") {
    next.setHours(next.getHours() + 1, 0, 0, 0);
  } else if (frequency === "daily") {
    next.setDate(next.getDate() + 1);
    next.setHours(timeOfDay, 0, 0, 0);
  } else if (frequency === "weekly") {
    const currentDay = next.getDay() || 7; // Convert Sunday (0) to 7
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntilTarget);
    next.setHours(timeOfDay, 0, 0, 0);
  }

  return Math.floor(next.getTime() / 1000);
}

/**
 * Get queued notifications for a user
 */
export async function getUserQueuedNotifications(userId: number, status?: string) {
  return await prisma.mantis_notification_queue_table.findMany({
    where: {
      user_id: userId,
      status: status || undefined,
    },
    orderBy: { date_created: "desc" },
    take: 100,
  });
}

/**
 * Clear sent digest notifications older than specified days
 */
export async function cleanupOldDigests(daysOld: number = 30): Promise<number> {
  const cutoff = Math.floor(Date.now() / 1000) - daysOld * 24 * 60 * 60;

  const result = await prisma.mantis_notification_queue_table.deleteMany({
    where: {
      status: "sent",
      date_sent: { lt: cutoff },
    },
  });

  logger.log(`Cleaned up ${result.count} old digest notifications`);
  return result.count;
}
