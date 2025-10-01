// /lib/notify/email-audit.ts
import "server-only";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

export interface EmailAuditEntry {
  bugId: number;
  userId: number;
  recipient: string;
  subject: string;
  channel: string; // "email", "pushover", "rocketchat", "teams", "webpush"
  status: "success" | "failed" | "pending";
  errorMessage?: string;
}

/**
 * Log an email notification to the audit table
 */
export async function logEmailAudit(entry: EmailAuditEntry): Promise<void> {
  try {
    await prisma.mantis_email_audit_table.create({
      data: {
        bug_id: entry.bugId,
        user_id: entry.userId,
        recipient: entry.recipient,
        subject: entry.subject,
        channel: entry.channel,
        status: entry.status,
        error_message: entry.errorMessage || "",
        date_sent: Math.floor(Date.now() / 1000),
      },
    });
  } catch (error) {
    // Log audit failures but don't throw to avoid breaking notification flow
    logger.error("Failed to log email audit:", error);
  }
}

/**
 * Log multiple email notifications in batch
 */
export async function logEmailAuditBatch(
  entries: EmailAuditEntry[]
): Promise<void> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);
    await prisma.mantis_email_audit_table.createMany({
      data: entries.map((entry) => ({
        bug_id: entry.bugId,
        user_id: entry.userId,
        recipient: entry.recipient,
        subject: entry.subject,
        channel: entry.channel,
        status: entry.status,
        error_message: entry.errorMessage || "",
        date_sent: timestamp,
      })),
    });
  } catch (error) {
    logger.error("Failed to log email audit batch:", error);
  }
}

/**
 * Get email audit statistics for a bug
 */
export async function getEmailAuditStats(bugId: number) {
  const stats = await prisma.mantis_email_audit_table.groupBy({
    by: ["channel", "status"],
    where: { bug_id: bugId },
    _count: true,
  });

  return stats;
}

/**
 * Get recent email audit entries for a user
 */
export async function getUserEmailAudit(userId: number, limit: number = 10) {
  return await prisma.mantis_email_audit_table.findMany({
    where: { user_id: userId },
    orderBy: { date_sent: "desc" },
    take: limit,
  });
}
