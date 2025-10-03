// /lib/notify/issue-notifications.ts
import "server-only";
import { prisma } from "@/db/client";
import { secrets } from "@/config/secrets";
import { sendEmail } from "@/lib/notify/postmark";
import { sendPushover } from "@/lib/notify/pushover";
import { sendRocketChat } from "@/lib/notify/rocketchat";
import { sendTeams } from "@/lib/notify/teams";
import { logNotificationHistory } from "@/lib/notify/history";
import { logger } from "@/lib/logger";
import {
  filterNotificationRecipients,
  type NotificationEventType,
} from "@/lib/notify/preference-checker";

export type IssueAction = "created" | "updated" | "deleted" | "commented" | "status_changed" | "assigned";

export interface NotificationContext {
  issueId: number;
  issueSummary: string;
  projectId: number;
  action: IssueAction;
  actorId: number;
  actorName: string;
  changes?: string; // Brief description of changes (e.g., "Status changed to resolved")
}

/**
 * Get all users assigned to a project (excluding the actor)
 */
async function getProjectUsers(projectId: number, excludeUserId: number) {
  // Get all users assigned to the project
  const projectUsers = await prisma.mantis_project_user_list_table.findMany({
    where: { project_id: projectId },
    select: { user_id: true }
  });

  // Get user details (email, username, realname)
  const userIds = projectUsers.map(pu => pu.user_id).filter(id => id !== excludeUserId);

  const users = await prisma.mantis_user_table.findMany({
    where: {
      id: { in: userIds },
      enabled: 1 // Only active users
    },
    select: {
      id: true,
      username: true,
      realname: true,
      email: true
    }
  });

  return users;
}

/**
 * Generate email HTML template for issue notifications
 */
function generateEmailTemplate(ctx: NotificationContext, issueUrl: string): string {
  const actionText = {
    created: "created",
    updated: "updated",
    deleted: "deleted",
    commented: "commented on",
    status_changed: "changed the status of",
    assigned: "assigned"
  }[ctx.action];

  return `
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
    .button { display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
    .button:hover { background: #1d4ed8; }
    .footer { margin-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
    .changes { background: #fff; padding: 12px; border-left: 4px solid #2563eb; margin: 12px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2 style="margin: 0;">Issue Notification</h2>
    </div>
    <div class="content">
      <p><strong>${ctx.actorName}</strong> ${actionText} issue <strong>#${ctx.issueId}</strong></p>
      <p style="font-size: 18px; color: #1f2937; margin: 16px 0;"><strong>${ctx.issueSummary}</strong></p>
      ${ctx.changes ? `<div class="changes"><strong>Changes:</strong> ${ctx.changes}</div>` : ''}
      <p>Click the button below to view the issue:</p>
      <a href="${issueUrl}" class="button" style="color: #ffffff !important; text-decoration: none;">View Issue #${ctx.issueId}</a>
      <div class="footer">
        <p>This is an automated notification from ${secrets.fromName}.</p>
        <p>You received this email because you are assigned to this project.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate text notification for non-email channels
 */
function generateTextNotification(ctx: NotificationContext, issueUrl: string): string {
  const actionText = {
    created: "created",
    updated: "updated",
    deleted: "deleted",
    commented: "commented on",
    status_changed: "changed the status of",
    assigned: "assigned"
  }[ctx.action];

  let text = `${ctx.actorName} ${actionText} issue #${ctx.issueId}: ${ctx.issueSummary}`;
  if (ctx.changes) {
    text += `\n${ctx.changes}`;
  }
  text += `\n${issueUrl}`;

  return text;
}

/**
 * Map IssueAction to NotificationEventType
 */
function mapActionToEventType(action: IssueAction): NotificationEventType {
  switch (action) {
    case "created":
      return "new";
    case "assigned":
      return "assigned";
    case "commented":
      return "bugnote";
    case "status_changed":
      return "status";
    default:
      return "new"; // Default fallback
  }
}

/**
 * Send notifications for issue actions
 */
export async function notifyIssueAction(ctx: NotificationContext, baseUrl: string) {
  try {
    // Get the issue to determine severity
    const issue = await prisma.mantis_bug_table.findUnique({
      where: { id: ctx.issueId },
      select: { severity: true },
    });

    if (!issue) {
      logger.error(`Issue #${ctx.issueId} not found for notification`);
      return;
    }

    // Get project users (excluding the actor who made the change)
    const users = await getProjectUsers(ctx.projectId, ctx.actorId);

    if (users.length === 0) {
      logger.log(`No users to notify for issue #${ctx.issueId}`);
      return;
    }

    // Determine notification event type based on action
    const eventType = mapActionToEventType(ctx.action);

    // Filter users based on their notification preferences
    const { recipients: recipientIds, reasons } = await filterNotificationRecipients(
      users.map((u) => u.id),
      eventType,
      issue.severity
    );

    // Get user details for recipients only
    const recipientUsers = users.filter((u) => recipientIds.includes(u.id));

    if (recipientUsers.length === 0) {
      logger.log(
        `No users match notification criteria for issue #${ctx.issueId} (${eventType}, severity ${issue.severity})`
      );
      return;
    }

    logger.log(
      `Notifying ${recipientUsers.length}/${users.length} users for issue #${ctx.issueId} (${eventType}, severity ${issue.severity})`
    );

    const issueUrl = `${baseUrl}/issues/${ctx.issueId}`;
    const subject = `Issue #${ctx.issueId}: ${ctx.issueSummary}`;

    // Send email notifications (only to users who passed preference filter)
    if (secrets.postmarkEnabled) {
      const emailTasks = recipientUsers
        .filter(user => user.email && user.email.includes('@'))
        .map(user => {
          const html = generateEmailTemplate(ctx, issueUrl);
          return sendEmail(user.email, subject, html).catch(err => {
            logger.error(`Failed to send email to ${user.email}:`, err);
          });
        });

      await Promise.allSettled(emailTasks);
    }

    // Send other notifications (Pushover, Rocket.Chat, Teams) for all issue actions
    const textNotification = generateTextNotification(ctx, issueUrl);

    const otherTasks: Promise<any>[] = [];

    if (secrets.pushoverEnabled) {
      otherTasks.push(
        sendPushover(textNotification, subject).catch(err => {
          logger.error('Failed to send Pushover notification:', err);
        })
      );
    }

    if (secrets.rocketchatEnabled) {
      otherTasks.push(
        sendRocketChat({
          subject,
          body: textNotification,
          bugId: ctx.issueId,
          eventType: ctx.action,
          link: `/issues/${ctx.issueId}`,
          projectId: ctx.projectId,
        }).catch(err => {
          logger.error('Failed to send Rocket.Chat notification:', err);
        })
      );
    }

    if (secrets.teamsEnabled) {
      otherTasks.push(
        sendTeams(`**${subject}**\n${textNotification}`).catch(err => {
          logger.error('Failed to send Teams notification:', err);
        })
      );
    }

    await Promise.allSettled(otherTasks);

    // Log notification history for all recipients
    if (recipientUsers.length > 0) {
      logger.log(`Logging notification history for ${recipientUsers.length} recipients`);

      const historyPromises = recipientUsers.map((user) => {
        const channels: string[] = [];
        if (secrets.postmarkEnabled && user.email) channels.push("email");
        if (secrets.pushoverEnabled) channels.push("pushover");
        if (secrets.rocketchatEnabled) channels.push("rocketchat");
        if (secrets.teamsEnabled) channels.push("teams");

        logger.log(`Logging history for user ${user.id}, bug #${ctx.issueId}, channels: ${channels.join(", ")}`);

        return logNotificationHistory({
          userId: user.id,
          bugId: ctx.issueId,
          eventType,
          subject,
          body: textNotification,
          channelsSent: channels,
        }).then((historyId) => {
          logger.log(`Logged notification history ${historyId} for user ${user.id}`);
        }).catch((err) => {
          logger.error(`Failed to log notification history for user ${user.id}:`, err);
        });
      });

      await Promise.allSettled(historyPromises);
      logger.log(`Completed logging notification history for ${recipientUsers.length} recipients`);
    }

    logger.log(`Sent notifications for issue #${ctx.issueId} to ${recipientUsers.length} users`);
  } catch (error) {
    logger.error('Error sending issue notifications:', error);
  }
}