// /lib/notify/webpush.ts
import "server-only";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";
import { secrets } from "@/config/secrets";
import webpush from "web-push";

// Configure web-push with VAPID keys from secrets
if (secrets.webPushEnabled && secrets.vapidPublicKey && secrets.vapidPrivateKey) {
  webpush.setVapidDetails(
    secrets.vapidSubject || "mailto:noreply@example.com",
    secrets.vapidPublicKey,
    secrets.vapidPrivateKey
  );
}

export interface WebPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface WebPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Subscribe user to web push notifications
 */
export async function subscribeWebPush(
  userId: number,
  subscription: WebPushSubscription,
  userAgent?: string,
  ipAddress?: string
): Promise<void> {
  try {
    await prisma.mantis_webpush_subscription_table.upsert({
      where: { endpoint: subscription.endpoint },
      create: {
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: userAgent || null,
        ip_address: ipAddress || null,
        enabled: 1,
        date_created: Math.floor(Date.now() / 1000),
        date_last_used: Math.floor(Date.now() / 1000),
      },
      update: {
        p256dh_key: subscription.keys.p256dh,
        auth_key: subscription.keys.auth,
        user_agent: userAgent || undefined,
        ip_address: ipAddress || undefined,
        enabled: 1,
        date_last_used: Math.floor(Date.now() / 1000),
      },
    });

    logger.log(`Subscribed user ${userId} to web push`);
  } catch (error) {
    logger.error("Failed to subscribe to web push:", error);
    throw error;
  }
}

/**
 * Unsubscribe user from web push notifications
 */
export async function unsubscribeWebPush(endpoint: string): Promise<void> {
  try {
    await prisma.mantis_webpush_subscription_table.updateMany({
      where: { endpoint },
      data: { enabled: 0 },
    });

    logger.log(`Unsubscribed from web push: ${endpoint}`);
  } catch (error) {
    logger.error("Failed to unsubscribe from web push:", error);
    throw error;
  }
}

/**
 * Get user's active web push subscriptions
 */
export async function getUserWebPushSubscriptions(userId: number) {
  return await prisma.mantis_webpush_subscription_table.findMany({
    where: {
      user_id: userId,
      enabled: 1,
    },
  });
}

/**
 * Send web push notification to a user
 */
export async function sendWebPush(
  userId: number,
  payload: WebPushPayload
): Promise<void> {
  if (!secrets.webPushEnabled) {
    logger.log("Web push notifications are disabled");
    return;
  }

  try {
    // Get user's active subscriptions
    const subscriptions = await getUserWebPushSubscriptions(userId);

    if (subscriptions.length === 0) {
      logger.log(`User ${userId} has no active web push subscriptions`);
      return;
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || "/icon-192.png",
      badge: payload.badge || "/badge-72.png",
      image: payload.image,
      tag: payload.tag,
      data: payload.data || {},
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
      silent: payload.silent || false,
      timestamp: Date.now(),
    });

    // Send to all user's subscriptions
    const sendPromises = subscriptions.map(async (sub) => {
      try {
        const pushSubscription: webpush.PushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh_key,
            auth: sub.auth_key,
          },
        };

        await webpush.sendNotification(pushSubscription, notificationPayload);

        // Update last used timestamp
        await prisma.mantis_webpush_subscription_table.update({
          where: { id: sub.id },
          data: { date_last_used: Math.floor(Date.now() / 1000) },
        });

        logger.log(`Sent web push to user ${userId} (subscription ${sub.id})`);
      } catch (error: any) {
        // Handle subscription errors (expired, invalid, etc.)
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription no longer valid, disable it
          await prisma.mantis_webpush_subscription_table.update({
            where: { id: sub.id },
            data: { enabled: 0 },
          });
          logger.log(`Disabled invalid subscription ${sub.id} for user ${userId}`);
        } else {
          logger.error(`Failed to send web push to subscription ${sub.id}:`, error);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    logger.error("Failed to send web push notification:", error);
    throw error;
  }
}

/**
 * Send web push notification to multiple users
 */
export async function sendWebPushBatch(
  userIds: number[],
  payload: WebPushPayload
): Promise<void> {
  const sendPromises = userIds.map((userId) =>
    sendWebPush(userId, payload).catch((error) => {
      logger.error(`Failed to send web push to user ${userId}:`, error);
    })
  );

  await Promise.allSettled(sendPromises);
}

/**
 * Test web push notification
 */
export async function testWebPush(userId: number): Promise<void> {
  await sendWebPush(userId, {
    title: "Test Notification",
    body: "This is a test web push notification from NextBT",
    icon: "/icon-192.png",
    badge: "/badge-72.png",
    tag: "test",
    data: { type: "test" },
  });
}

/**
 * Clean up old/expired subscriptions
 */
export async function cleanupExpiredSubscriptions(daysInactive: number = 90): Promise<number> {
  const cutoff = Math.floor(Date.now() / 1000) - daysInactive * 24 * 60 * 60;

  const result = await prisma.mantis_webpush_subscription_table.deleteMany({
    where: {
      OR: [
        { enabled: 0 },
        { date_last_used: { lt: cutoff } },
      ],
    },
  });

  logger.log(`Cleaned up ${result.count} expired web push subscriptions`);
  return result.count;
}

/**
 * Get web push statistics
 */
export async function getWebPushStats() {
  const [total, active, inactive] = await Promise.all([
    prisma.mantis_webpush_subscription_table.count(),
    prisma.mantis_webpush_subscription_table.count({ where: { enabled: 1 } }),
    prisma.mantis_webpush_subscription_table.count({ where: { enabled: 0 } }),
  ]);

  const userCounts = await prisma.mantis_webpush_subscription_table.groupBy({
    by: ["user_id"],
    where: { enabled: 1 },
    _count: true,
  });

  return {
    total,
    active,
    inactive,
    uniqueUsers: userCounts.length,
    averageSubscriptionsPerUser: userCounts.length > 0
      ? active / userCounts.length
      : 0,
  };
}
