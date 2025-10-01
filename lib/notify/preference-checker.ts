// /lib/notify/preference-checker.ts
import "server-only";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

export type NotificationEventType =
  | "new"
  | "assigned"
  | "feedback"
  | "resolved"
  | "closed"
  | "reopened"
  | "bugnote"
  | "status"
  | "priority";

interface UserNotificationPreference {
  user_id: number;
  email_on_new: number;
  email_on_assigned: number;
  email_on_feedback: number;
  email_on_resolved: number;
  email_on_closed: number;
  email_on_reopened: number;
  email_on_bugnote: number;
  email_on_status: number;
  email_on_priority: number;
  email_on_new_min_severity: number;
  email_on_assigned_min_severity: number;
  email_on_feedback_min_severity: number;
  email_on_resolved_min_severity: number;
  email_on_closed_min_severity: number;
  email_on_reopened_min_severity: number;
  email_on_bugnote_min_severity: number;
  email_on_status_min_severity: number;
  email_on_priority_min_severity: number;
}

/**
 * Check if a user should receive a notification based on their preferences
 */
export function shouldNotifyUser(
  eventType: NotificationEventType,
  issueSeverity: number,
  userPreference: UserNotificationPreference | null
): { shouldNotify: boolean; reason: string } {
  // No preferences = no notifications
  if (!userPreference) {
    return {
      shouldNotify: false,
      reason: "No notification preferences configured",
    };
  }

  // Get the enabled flag and severity threshold for this event type
  const enabledField = `email_on_${eventType}` as keyof UserNotificationPreference;
  const severityField =
    `email_on_${eventType}_min_severity` as keyof UserNotificationPreference;

  const isEnabled = userPreference[enabledField] as number;
  const minSeverity = userPreference[severityField] as number;

  // Check if notifications are enabled for this event type
  if (isEnabled !== 1) {
    return {
      shouldNotify: false,
      reason: `${eventType} notifications disabled in preferences`,
    };
  }

  // Check severity threshold
  if (issueSeverity < minSeverity) {
    return {
      shouldNotify: false,
      reason: `Severity ${issueSeverity} below threshold ${minSeverity}`,
    };
  }

  // All checks passed
  return {
    shouldNotify: true,
    reason: `${eventType} notifications enabled, severity ${issueSeverity} >= ${minSeverity}`,
  };
}

/**
 * Get notification preferences for multiple users
 */
export async function getUserPreferences(
  userIds: number[]
): Promise<Map<number, UserNotificationPreference>> {
  if (userIds.length === 0) {
    return new Map();
  }

  const preferences = await prisma.mantis_user_pref_table.findMany({
    where: {
      user_id: { in: userIds },
      project_id: 0, // Global preferences
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
      email_on_priority: true,
      email_on_new_min_severity: true,
      email_on_assigned_min_severity: true,
      email_on_feedback_min_severity: true,
      email_on_resolved_min_severity: true,
      email_on_closed_min_severity: true,
      email_on_reopened_min_severity: true,
      email_on_bugnote_min_severity: true,
      email_on_status_min_severity: true,
      email_on_priority_min_severity: true,
    },
  });

  return new Map(preferences.map((p) => [p.user_id, p]));
}

/**
 * Filter users who should receive notifications based on event type and preferences
 */
export async function filterNotificationRecipients(
  userIds: number[],
  eventType: NotificationEventType,
  issueSeverity: number
): Promise<{
  recipients: number[];
  reasons: Map<number, string>;
}> {
  const preferences = await getUserPreferences(userIds);
  const recipients: number[] = [];
  const reasons = new Map<number, string>();

  for (const userId of userIds) {
    const pref = preferences.get(userId);
    const { shouldNotify, reason } = shouldNotifyUser(
      eventType,
      issueSeverity,
      pref || null
    );

    reasons.set(userId, reason);

    if (shouldNotify) {
      recipients.push(userId);
    }
  }

  logger.log(
    `Filtered ${userIds.length} users to ${recipients.length} recipients for ${eventType} notifications`
  );

  return { recipients, reasons };
}
