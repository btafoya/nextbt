// /lib/notify/rocketchat-audit.ts
import "server-only";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

/**
 * Rocket.Chat notification metadata stored in audit log
 */
export interface RocketChatAuditMetadata {
  messageId?: string;
  timestamp?: string;
  channel?: string;
  method?: "webhook" | "rest_api";
}

/**
 * Rocket.Chat audit entry with parsed metadata
 */
export interface RocketChatAuditEntry {
  id: number;
  bugId: number;
  userId: number;
  recipient: string;
  subject: string;
  status: string;
  dateSent: number;
  metadata: RocketChatAuditMetadata | null;
  errorMessage?: string;
}

/**
 * Rocket.Chat delivery statistics
 */
export interface RocketChatStats {
  totalSent: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  webhookCount: number;
  restApiCount: number;
  messageIdCaptureRate: number;
  byChannel: Record<string, number>;
  recentActivity: {
    last24h: number;
    last7d: number;
    last30d: number;
  };
}

/**
 * Parse metadata JSON from audit log
 */
function parseMetadata(errorMessage: string): RocketChatAuditMetadata | null {
  try {
    // Check if it's JSON (starts with { or [)
    if (errorMessage.startsWith("{") || errorMessage.startsWith("[")) {
      return JSON.parse(errorMessage);
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Extract message ID from audit metadata
 */
export function extractMessageId(errorMessage: string): string | null {
  const metadata = parseMetadata(errorMessage);
  return metadata?.messageId || null;
}

/**
 * Get Rocket.Chat audit entries for a bug
 */
export async function getRocketChatAuditForBug(
  bugId: number
): Promise<RocketChatAuditEntry[]> {
  try {
    const entries = await prisma.mantis_email_audit_table.findMany({
      where: {
        bug_id: bugId,
        channel: "rocketchat",
      },
      orderBy: { date_sent: "desc" },
    });

    return entries.map((entry) => ({
      id: entry.id,
      bugId: entry.bug_id,
      userId: entry.user_id,
      recipient: entry.recipient,
      subject: entry.subject,
      status: entry.status,
      dateSent: entry.date_sent,
      metadata:
        entry.status === "success"
          ? parseMetadata(entry.error_message)
          : null,
      errorMessage:
        entry.status === "failed" ? entry.error_message : undefined,
    }));
  } catch (error) {
    logger.error("Failed to get Rocket.Chat audit for bug:", error);
    return [];
  }
}

/**
 * Get Rocket.Chat audit entries for a user
 */
export async function getRocketChatAuditForUser(
  userId: number,
  limit: number = 20
): Promise<RocketChatAuditEntry[]> {
  try {
    const entries = await prisma.mantis_email_audit_table.findMany({
      where: {
        user_id: userId,
        channel: "rocketchat",
      },
      orderBy: { date_sent: "desc" },
      take: limit,
    });

    return entries.map((entry) => ({
      id: entry.id,
      bugId: entry.bug_id,
      userId: entry.user_id,
      recipient: entry.recipient,
      subject: entry.subject,
      status: entry.status,
      dateSent: entry.date_sent,
      metadata:
        entry.status === "success"
          ? parseMetadata(entry.error_message)
          : null,
      errorMessage:
        entry.status === "failed" ? entry.error_message : undefined,
    }));
  } catch (error) {
    logger.error("Failed to get Rocket.Chat audit for user:", error);
    return [];
  }
}

/**
 * Find audit entry by Rocket.Chat message ID
 */
export async function findAuditByMessageId(
  messageId: string
): Promise<RocketChatAuditEntry | null> {
  try {
    // Search for message ID in error_message field (JSON metadata)
    const entries = await prisma.mantis_email_audit_table.findMany({
      where: {
        channel: "rocketchat",
        status: "success",
        error_message: {
          contains: messageId,
        },
      },
      take: 1,
    });

    if (entries.length === 0) {
      return null;
    }

    const entry = entries[0];
    return {
      id: entry.id,
      bugId: entry.bug_id,
      userId: entry.user_id,
      recipient: entry.recipient,
      subject: entry.subject,
      status: entry.status,
      dateSent: entry.date_sent,
      metadata: parseMetadata(entry.error_message),
    };
  } catch (error) {
    logger.error("Failed to find audit by message ID:", error);
    return null;
  }
}

/**
 * Get comprehensive Rocket.Chat statistics
 */
export async function getRocketChatStats(
  days: number = 30
): Promise<RocketChatStats> {
  try {
    const sinceTimestamp = Math.floor(
      Date.now() / 1000 - days * 24 * 60 * 60
    );

    // Get all Rocket.Chat entries for the period
    const entries = await prisma.mantis_email_audit_table.findMany({
      where: {
        channel: "rocketchat",
        date_sent: { gte: sinceTimestamp },
      },
    });

    const totalSent = entries.length;
    const successCount = entries.filter((e) => e.status === "success").length;
    const failureCount = entries.filter((e) => e.status === "failed").length;
    const successRate =
      totalSent > 0 ? (successCount / totalSent) * 100 : 0;

    // Count webhook vs REST API usage (REST API has message IDs)
    const successEntries = entries.filter((e) => e.status === "success");
    const restApiCount = successEntries.filter((e) => {
      const metadata = parseMetadata(e.error_message);
      return metadata?.messageId !== undefined;
    }).length;
    const webhookCount = successCount - restApiCount;
    const messageIdCaptureRate =
      successCount > 0 ? (restApiCount / successCount) * 100 : 0;

    // Count by channel (recipient field contains channel name)
    const byChannel: Record<string, number> = {};
    entries.forEach((entry) => {
      const channel = entry.recipient || "unknown";
      byChannel[channel] = (byChannel[channel] || 0) + 1;
    });

    // Recent activity breakdown
    const now = Math.floor(Date.now() / 1000);
    const last24h = entries.filter(
      (e) => e.date_sent >= now - 24 * 60 * 60
    ).length;
    const last7d = entries.filter(
      (e) => e.date_sent >= now - 7 * 24 * 60 * 60
    ).length;
    const last30d = entries.filter(
      (e) => e.date_sent >= now - 30 * 24 * 60 * 60
    ).length;

    return {
      totalSent,
      successCount,
      failureCount,
      successRate: Math.round(successRate * 100) / 100,
      webhookCount,
      restApiCount,
      messageIdCaptureRate: Math.round(messageIdCaptureRate * 100) / 100,
      byChannel,
      recentActivity: {
        last24h,
        last7d,
        last30d,
      },
    };
  } catch (error) {
    logger.error("Failed to get Rocket.Chat stats:", error);
    return {
      totalSent: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      webhookCount: 0,
      restApiCount: 0,
      messageIdCaptureRate: 0,
      byChannel: {},
      recentActivity: {
        last24h: 0,
        last7d: 0,
        last30d: 0,
      },
    };
  }
}

/**
 * Get recent Rocket.Chat failures for debugging
 */
export async function getRecentFailures(
  limit: number = 10
): Promise<RocketChatAuditEntry[]> {
  try {
    const entries = await prisma.mantis_email_audit_table.findMany({
      where: {
        channel: "rocketchat",
        status: "failed",
      },
      orderBy: { date_sent: "desc" },
      take: limit,
    });

    return entries.map((entry) => ({
      id: entry.id,
      bugId: entry.bug_id,
      userId: entry.user_id,
      recipient: entry.recipient,
      subject: entry.subject,
      status: entry.status,
      dateSent: entry.date_sent,
      metadata: null,
      errorMessage: entry.error_message,
    }));
  } catch (error) {
    logger.error("Failed to get recent Rocket.Chat failures:", error);
    return [];
  }
}

/**
 * Get notifications that used REST API (have message IDs)
 */
export async function getNotificationsWithMessageIds(
  limit: number = 20
): Promise<RocketChatAuditEntry[]> {
  try {
    // Find successful entries with JSON metadata containing messageId
    const entries = await prisma.mantis_email_audit_table.findMany({
      where: {
        channel: "rocketchat",
        status: "success",
        error_message: {
          contains: "messageId",
        },
      },
      orderBy: { date_sent: "desc" },
      take: limit,
    });

    return entries.map((entry) => ({
      id: entry.id,
      bugId: entry.bug_id,
      userId: entry.user_id,
      recipient: entry.recipient,
      subject: entry.subject,
      status: entry.status,
      dateSent: entry.date_sent,
      metadata: parseMetadata(entry.error_message),
    }));
  } catch (error) {
    logger.error("Failed to get notifications with message IDs:", error);
    return [];
  }
}

/**
 * Get delivery method breakdown (webhook vs REST API)
 */
export async function getDeliveryMethodBreakdown(days: number = 7): Promise<{
  webhook: number;
  restApi: number;
  total: number;
}> {
  try {
    const sinceTimestamp = Math.floor(
      Date.now() / 1000 - days * 24 * 60 * 60
    );

    const entries = await prisma.mantis_email_audit_table.findMany({
      where: {
        channel: "rocketchat",
        status: "success",
        date_sent: { gte: sinceTimestamp },
      },
    });

    const restApi = entries.filter((e) => {
      const metadata = parseMetadata(e.error_message);
      return metadata?.messageId !== undefined;
    }).length;

    const webhook = entries.length - restApi;

    return {
      webhook,
      restApi,
      total: entries.length,
    };
  } catch (error) {
    logger.error("Failed to get delivery method breakdown:", error);
    return { webhook: 0, restApi: 0, total: 0 };
  }
}

/**
 * Check if Rocket.Chat notifications are being delivered successfully
 */
export async function isRocketChatHealthy(): Promise<{
  healthy: boolean;
  recentSuccessRate: number;
  lastSuccessfulDelivery?: number;
  issuesSummary?: string;
}> {
  try {
    // Check last 24 hours
    const last24h = Math.floor(Date.now() / 1000 - 24 * 60 * 60);

    const recent = await prisma.mantis_email_audit_table.findMany({
      where: {
        channel: "rocketchat",
        date_sent: { gte: last24h },
      },
      orderBy: { date_sent: "desc" },
    });

    if (recent.length === 0) {
      return {
        healthy: true,
        recentSuccessRate: 0,
        issuesSummary: "No notifications sent in last 24 hours",
      };
    }

    const successCount = recent.filter((e) => e.status === "success").length;
    const successRate = (successCount / recent.length) * 100;

    // Find last successful delivery
    const lastSuccess = recent.find((e) => e.status === "success");

    // Consider healthy if success rate > 80%
    const healthy = successRate >= 80;

    let issuesSummary: string | undefined;
    if (!healthy) {
      const failures = recent.filter((e) => e.status === "failed");
      const recentErrors = failures.slice(0, 3).map((e) => e.error_message);
      issuesSummary = `Low success rate (${successRate.toFixed(1)}%). Recent errors: ${recentErrors.join(", ")}`;
    }

    return {
      healthy,
      recentSuccessRate: Math.round(successRate * 100) / 100,
      lastSuccessfulDelivery: lastSuccess?.date_sent,
      issuesSummary,
    };
  } catch (error) {
    logger.error("Failed to check Rocket.Chat health:", error);
    return {
      healthy: false,
      recentSuccessRate: 0,
      issuesSummary: "Error checking health: " + String(error),
    };
  }
}
