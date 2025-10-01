// /lib/notify/recipients.ts
import { prisma } from "@/db/client";
import { secrets } from "@/config/secrets";

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
 */
export async function getNotificationRecipients(
  issueId: number
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
  const preferences = await prisma.mantis_user_pref_table.findMany({
    where: {
      user_id: { in: userIds },
    },
    select: {
      user_id: true,
      email_on_new: true,
      email_on_assigned: true,
      email_on_feedback: true,
      email_on_resolved: true,
      email_on_closed: true,
      email_on_reopened: true,
      email_on_bugnote: true,
      email_on_status: true,
      email_on_new_min_severity: true,
    },
  });

  const prefMap = new Map(preferences.map((p) => [p.user_id, p]));

  // Determine who will receive notifications
  const recipients: NotificationRecipient[] = projectUsers
    .filter((pu) => pu.user.enabled === 1 && pu.user.email) // Only enabled users with email
    .map((pu) => {
      const pref = prefMap.get(pu.user_id);
      const user = pu.user;

      // Determine if user will receive notification and why
      let willReceive = false;
      let reason = "No notification preference set";

      if (!secrets.postmarkEnabled) {
        willReceive = false;
        reason = "Email notifications disabled globally";
      } else if (!user.email) {
        willReceive = false;
        reason = "No email address";
      } else if (pref) {
        // Check if user wants notifications for new issues
        if (pref.email_on_new === 1) {
          // Check severity threshold
          if (issue.severity >= pref.email_on_new_min_severity) {
            willReceive = true;
            if (user.id === issue.reporter_id) {
              reason = "Reporter (new issue notifications enabled)";
            } else if (user.id === issue.handler_id) {
              reason = "Assignee (new issue notifications enabled)";
            } else {
              reason = "Project member (new issue notifications enabled)";
            }
          } else {
            willReceive = false;
            reason = `Severity below threshold (${issue.severity} < ${pref.email_on_new_min_severity})`;
          }
        } else {
          willReceive = false;
          reason = "New issue notifications disabled in preferences";
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
