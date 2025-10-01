// /lib/notify/recipients.ts
import { prisma } from "@/db/client";
import { secrets } from "@/config/secrets";
import {
  getUserPreferences,
  shouldNotifyUser,
  type NotificationEventType,
} from "@/lib/notify/preference-checker";

export interface NotificationRecipient {
  id: number;
  username: string;
  realname: string;
  email: string;
  willReceive: boolean;
  reason: string;
}

/**
 * Get all users who should receive notifications for an issue
 * Based on project membership and MantisBT email preferences
 *
 * @param issueId - The issue ID
 * @param eventType - The notification event type (defaults to "new" for backward compatibility)
 */
export async function getNotificationRecipients(
  issueId: number,
  eventType: NotificationEventType = "new"
): Promise<NotificationRecipient[]> {
  // Get the issue with project info
  const issue = await prisma.mantis_bug_table.findUnique({
    where: { id: issueId },
    select: {
      project_id: true,
      reporter_id: true,
      handler_id: true,
      severity: true,
    },
  });

  if (!issue) return [];

  // Get all users with access to this project
  const projectUsers = await prisma.mantis_project_user_list_table.findMany({
    where: {
      project_id: issue.project_id,
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          realname: true,
          email: true,
          enabled: true,
        },
      },
    },
  });

  // Get user preferences for email notifications
  const userIds = projectUsers.map((pu) => pu.user_id);
  const prefMap = await getUserPreferences(userIds);

  // Determine who will receive notifications
  const recipients: NotificationRecipient[] = projectUsers
    .filter((pu) => pu.user.enabled === 1 && pu.user.email) // Only enabled users with email
    .map((pu) => {
      const user = pu.user;
      const pref = prefMap.get(pu.user_id);

      // Determine if user will receive notification and why
      let willReceive = false;
      let reason = "No notification preference set";

      if (!secrets.postmarkEnabled) {
        willReceive = false;
        reason = "Email notifications disabled globally";
      } else if (!user.email) {
        willReceive = false;
        reason = "No email address";
      } else {
        // Use centralized preference checker
        const result = shouldNotifyUser(eventType, issue.severity, pref || null);
        willReceive = result.shouldNotify;
        reason = result.reason;

        // Add user role context if they will receive
        if (willReceive) {
          if (user.id === issue.reporter_id) {
            reason = `Reporter (${reason})`;
          } else if (user.id === issue.handler_id) {
            reason = `Assignee (${reason})`;
          } else {
            reason = `Project member (${reason})`;
          }
        }
      }

      return {
        id: user.id,
        username: user.username,
        realname: user.realname,
        email: user.email,
        willReceive,
        reason,
      };
    })
    .sort((a, b) => {
      // Sort: will receive first, then by username
      if (a.willReceive && !b.willReceive) return -1;
      if (!a.willReceive && b.willReceive) return 1;
      return a.username.localeCompare(b.username);
    });

  return recipients;
}
