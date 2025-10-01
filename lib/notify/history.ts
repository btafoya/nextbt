// /lib/notify/history.ts
import "server-only";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";
import type { NotificationEventType } from "@/lib/notify/preference-checker";

export interface NotificationHistoryEntry {
  userId: number;
  bugId: number;
  eventType: NotificationEventType;
  subject: string;
  body: string;
  channelsSent: string[];
}

export interface NotificationHistoryItem {
  id: number;
  bugId: number;
  eventType: string;
  subject: string;
  body: string;
  channelsSent: string[];
  readStatus: boolean;
  dateSent: number;
  dateRead?: number;
}

export interface NotificationHistoryStats {
  total: number;
  unread: number;
  read: number;
  byEventType: Record<string, number>;
  byChannel: Record<string, number>;
  recentActivity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

/**
 * Log a notification to user's history
 */
export async function logNotificationHistory(
  entry: NotificationHistoryEntry
): Promise<number> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const history = await prisma.mantis_notification_history_table.create({
      data: {
        user_id: entry.userId,
        bug_id: entry.bugId,
        event_type: entry.eventType,
        subject: entry.subject,
        body: entry.body,
        channels_sent: entry.channelsSent,
        read_status: 0,
        date_sent: timestamp,
      },
    });

    logger.log(
      `Logged notification history ${history.id} for user ${entry.userId}`
    );
    return history.id;
  } catch (error) {
    logger.error("Failed to log notification history:", error);
    throw error;
  }
}

/**
 * Log multiple notifications to history in batch
 */
export async function logNotificationHistoryBatch(
  entries: NotificationHistoryEntry[]
): Promise<void> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    await prisma.mantis_notification_history_table.createMany({
      data: entries.map((entry) => ({
        user_id: entry.userId,
        bug_id: entry.bugId,
        event_type: entry.eventType,
        subject: entry.subject,
        body: entry.body,
        channels_sent: entry.channelsSent,
        read_status: 0,
        date_sent: timestamp,
      })),
    });

    logger.log(`Logged ${entries.length} notification history entries in batch`);
  } catch (error) {
    logger.error("Failed to log notification history batch:", error);
    throw error;
  }
}

/**
 * Get user's notification history with pagination
 */
export async function getUserNotificationHistory(
  userId: number,
  options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
    eventType?: string;
    bugId?: number;
  }
): Promise<NotificationHistoryItem[]> {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const where: any = { user_id: userId };

  if (options?.unreadOnly) {
    where.read_status = 0;
  }

  if (options?.eventType) {
    where.event_type = options.eventType;
  }

  if (options?.bugId) {
    where.bug_id = options.bugId;
  }

  const history = await prisma.mantis_notification_history_table.findMany({
    where,
    orderBy: { date_sent: "desc" },
    take: limit,
    skip: offset,
  });

  return history.map((h) => ({
    id: h.id,
    bugId: h.bug_id,
    eventType: h.event_type,
    subject: h.subject,
    body: h.body,
    channelsSent: (h.channels_sent as string[]) || [],
    readStatus: h.read_status === 1,
    dateSent: h.date_sent,
    dateRead: h.date_read || undefined,
  }));
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: number
): Promise<void> {
  try {
    await prisma.mantis_notification_history_table.update({
      where: { id: notificationId },
      data: {
        read_status: 1,
        date_read: Math.floor(Date.now() / 1000),
      },
    });

    logger.log(`Marked notification ${notificationId} as read`);
  } catch (error) {
    logger.error("Failed to mark notification as read:", error);
    throw error;
  }
}

/**
 * Mark multiple notifications as read
 */
export async function markNotificationsAsRead(
  notificationIds: number[]
): Promise<void> {
  try {
    await prisma.mantis_notification_history_table.updateMany({
      where: { id: { in: notificationIds } },
      data: {
        read_status: 1,
        date_read: Math.floor(Date.now() / 1000),
      },
    });

    logger.log(`Marked ${notificationIds.length} notifications as read`);
  } catch (error) {
    logger.error("Failed to mark notifications as read:", error);
    throw error;
  }
}

/**
 * Mark all user's notifications as read
 */
export async function markAllNotificationsAsRead(userId: number): Promise<number> {
  try {
    const result = await prisma.mantis_notification_history_table.updateMany({
      where: {
        user_id: userId,
        read_status: 0,
      },
      data: {
        read_status: 1,
        date_read: Math.floor(Date.now() / 1000),
      },
    });

    logger.log(`Marked ${result.count} notifications as read for user ${userId}`);
    return result.count;
  } catch (error) {
    logger.error("Failed to mark all notifications as read:", error);
    throw error;
  }
}

/**
 * Get unread notification count for user
 */
export async function getUnreadNotificationCount(userId: number): Promise<number> {
  return await prisma.mantis_notification_history_table.count({
    where: {
      user_id: userId,
      read_status: 0,
    },
  });
}

/**
 * Get notification history statistics for user
 */
export async function getUserNotificationStats(
  userId: number
): Promise<NotificationHistoryStats> {
  const [total, unread, read] = await Promise.all([
    prisma.mantis_notification_history_table.count({ where: { user_id: userId } }),
    prisma.mantis_notification_history_table.count({
      where: { user_id: userId, read_status: 0 },
    }),
    prisma.mantis_notification_history_table.count({
      where: { user_id: userId, read_status: 1 },
    }),
  ]);

  // Group by event type
  const byEventTypeResults = await prisma.mantis_notification_history_table.groupBy({
    by: ["event_type"],
    where: { user_id: userId },
    _count: true,
  });

  const byEventType: Record<string, number> = {};
  for (const result of byEventTypeResults) {
    byEventType[result.event_type] = result._count;
  }

  // Group by channel (simplified - just count any channel usage)
  const allHistory = await prisma.mantis_notification_history_table.findMany({
    where: { user_id: userId },
    select: { channels_sent: true },
  });

  const byChannel: Record<string, number> = {};
  for (const h of allHistory) {
    if (h.channels_sent) {
      const channels = (h.channels_sent as string[]);
      for (const channel of channels) {
        byChannel[channel] = (byChannel[channel] || 0) + 1;
      }
    }
  }

  // Recent activity
  const now = Math.floor(Date.now() / 1000);
  const [last24h, last7d, last30d] = await Promise.all([
    prisma.mantis_notification_history_table.count({
      where: {
        user_id: userId,
        date_sent: { gte: now - 24 * 60 * 60 },
      },
    }),
    prisma.mantis_notification_history_table.count({
      where: {
        user_id: userId,
        date_sent: { gte: now - 7 * 24 * 60 * 60 },
      },
    }),
    prisma.mantis_notification_history_table.count({
      where: {
        user_id: userId,
        date_sent: { gte: now - 30 * 24 * 60 * 60 },
      },
    }),
  ]);

  return {
    total,
    unread,
    read,
    byEventType,
    byChannel,
    recentActivity: { last24h, last7d, last30d },
  };
}

/**
 * Delete notification history entry
 */
export async function deleteNotificationHistory(notificationId: number): Promise<void> {
  try {
    await prisma.mantis_notification_history_table.delete({
      where: { id: notificationId },
    });

    logger.log(`Deleted notification history ${notificationId}`);
  } catch (error) {
    logger.error("Failed to delete notification history:", error);
    throw error;
  }
}

/**
 * Delete multiple notification history entries
 */
export async function deleteNotificationHistoryBatch(
  notificationIds: number[]
): Promise<void> {
  try {
    await prisma.mantis_notification_history_table.deleteMany({
      where: { id: { in: notificationIds } },
    });

    logger.log(`Deleted ${notificationIds.length} notification history entries`);
  } catch (error) {
    logger.error("Failed to delete notification history batch:", error);
    throw error;
  }
}

/**
 * Clean up old notification history
 */
export async function cleanupOldNotificationHistory(
  userId: number,
  daysOld: number = 90
): Promise<number> {
  const cutoff = Math.floor(Date.now() / 1000) - daysOld * 24 * 60 * 60;

  const result = await prisma.mantis_notification_history_table.deleteMany({
    where: {
      user_id: userId,
      date_sent: { lt: cutoff },
      read_status: 1, // Only delete read notifications
    },
  });

  logger.log(`Cleaned up ${result.count} old notification history entries for user ${userId}`);
  return result.count;
}

/**
 * Get notification timeline for an issue
 */
export async function getIssueNotificationTimeline(bugId: number): Promise<{
  notificationCount: number;
  uniqueRecipients: number;
  timeline: Array<{
    eventType: string;
    subject: string;
    recipientCount: number;
    dateSent: number;
  }>;
}> {
  const notifications = await prisma.mantis_notification_history_table.findMany({
    where: { bug_id: bugId },
    orderBy: { date_sent: "asc" },
  });

  const uniqueRecipients = new Set(notifications.map((n) => n.user_id)).size;

  // Group by event type and date
  const timelineMap = new Map<string, any>();

  for (const notif of notifications) {
    const key = `${notif.event_type}_${notif.date_sent}`;
    if (!timelineMap.has(key)) {
      timelineMap.set(key, {
        eventType: notif.event_type,
        subject: notif.subject,
        recipientCount: 0,
        dateSent: notif.date_sent,
      });
    }
    const entry = timelineMap.get(key);
    entry.recipientCount++;
  }

  return {
    notificationCount: notifications.length,
    uniqueRecipients,
    timeline: Array.from(timelineMap.values()),
  };
}
