// /lib/notify/dispatch.ts
import { sendEmail } from "@/lib/notify/postmark";
import { sendPushover } from "@/lib/notify/pushover";
import { sendRocketChat } from "@/lib/notify/rocketchat";
import { sendTeams } from "@/lib/notify/teams";
import { logEmailAudit, type EmailAuditEntry } from "@/lib/notify/email-audit";
import { logNotificationHistory, type NotificationHistoryEntry } from "@/lib/notify/history";
import { type NotificationEventType } from "@/lib/notify/preference-checker";
import { logger } from "@/lib/logger";

interface NotificationRecipient {
  userId?: number;
  email?: string;
  pushover?: boolean;
  rocketchat?: boolean;
  teams?: boolean;
  webpush?: any;
}

// Web push typically needs stored subscriptions per user
export async function notifyAll(
  recipients: NotificationRecipient[],
  subject: string,
  text: string,
  html?: string,
  bugId?: number,
  eventType?: string
) {
  const tasks: Promise<any>[] = [];
  const auditEntries: EmailAuditEntry[] = [];
  const historyEntries: NotificationHistoryEntry[] = [];

  for (const r of recipients) {
    if (r.email) {
      const emailTask = sendEmail(r.email, subject, html ?? `<pre>${text}</pre>`)
        .then(() => {
          if (bugId && r.userId) {
            auditEntries.push({
              bugId,
              userId: r.userId,
              recipient: r.email!,
              subject,
              channel: "email",
              status: "success",
            });
          }
          return { success: true };
        })
        .catch((error) => {
          if (bugId && r.userId) {
            auditEntries.push({
              bugId,
              userId: r.userId,
              recipient: r.email!,
              subject,
              channel: "email",
              status: "failed",
              errorMessage: error.message || String(error),
            });
          }
          throw error;
        });
      tasks.push(emailTask);
    }

    if (r.pushover) {
      const pushoverTask = sendPushover(text, subject)
        .then(() => {
          if (bugId && r.userId) {
            auditEntries.push({
              bugId,
              userId: r.userId,
              recipient: "pushover",
              subject,
              channel: "pushover",
              status: "success",
            });
          }
          return { success: true };
        })
        .catch((error) => {
          if (bugId && r.userId) {
            auditEntries.push({
              bugId,
              userId: r.userId,
              recipient: "pushover",
              subject,
              channel: "pushover",
              status: "failed",
              errorMessage: error.message || String(error),
            });
          }
          throw error;
        });
      tasks.push(pushoverTask);
    }

    if (r.rocketchat) {
      const rocketTask = sendRocketChat(`**${subject}**\n${text}`)
        .then(() => {
          if (bugId && r.userId) {
            auditEntries.push({
              bugId,
              userId: r.userId,
              recipient: "rocketchat",
              subject,
              channel: "rocketchat",
              status: "success",
            });
          }
          return { success: true };
        })
        .catch((error) => {
          if (bugId && r.userId) {
            auditEntries.push({
              bugId,
              userId: r.userId,
              recipient: "rocketchat",
              subject,
              channel: "rocketchat",
              status: "failed",
              errorMessage: error.message || String(error),
            });
          }
          throw error;
        });
      tasks.push(rocketTask);
    }

    if (r.teams) {
      const teamsTask = sendTeams(`**${subject}**\n${text}`)
        .then(() => {
          if (bugId && r.userId) {
            auditEntries.push({
              bugId,
              userId: r.userId,
              recipient: "teams",
              subject,
              channel: "teams",
              status: "success",
            });
          }
          return { success: true };
        })
        .catch((error) => {
          if (bugId && r.userId) {
            auditEntries.push({
              bugId,
              userId: r.userId,
              recipient: "teams",
              subject,
              channel: "teams",
              status: "failed",
              errorMessage: error.message || String(error),
            });
          }
          throw error;
        });
      tasks.push(teamsTask);
    }

    if (r.webpush) {
      // TODO: implement sendWebPush(subscription, payload)
    }
  }

  // Execute all notification tasks
  const results = await Promise.allSettled(tasks);

  // Collect successfully sent channels for each recipient
  const recipientChannels = new Map<number, string[]>();

  for (const r of recipients) {
    if (r.userId && bugId) {
      const channels: string[] = [];

      // Check which channels were successfully sent
      if (r.email) channels.push("email");
      if (r.pushover) channels.push("pushover");
      if (r.rocketchat) channels.push("rocketchat");
      if (r.teams) channels.push("teams");

      if (channels.length > 0) {
        recipientChannels.set(r.userId, channels);

        // Create notification history entry
        historyEntries.push({
          userId: r.userId,
          bugId,
          eventType: (eventType || "status") as NotificationEventType,
          subject,
          body: text,
          channelsSent: channels,
        });
      }
    }
  }

  // Log all audit entries asynchronously (don't block)
  if (auditEntries.length > 0) {
    Promise.all(auditEntries.map((entry) => logEmailAudit(entry))).catch((error) => {
      logger.error("Failed to log audit entries:", error);
    });
  }

  // Log notification history entries
  if (historyEntries.length > 0) {
    Promise.all(
      historyEntries.map((entry) => logNotificationHistory(entry))
    ).catch((error) => {
      logger.error("Failed to log notification history:", error);
    });
  }
}
