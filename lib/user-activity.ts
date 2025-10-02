// /lib/user-activity.ts
import "server-only";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

export type ActivityType =
  | "login"
  | "logout"
  | "login_failed"
  | "profile_update"
  | "password_change"
  | "email_change";

export interface ActivityLogParams {
  userId: number;
  actionType: ActivityType;
  description: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log user activity to mantis_user_activity_log_table
 */
export async function logUserActivity(params: ActivityLogParams): Promise<number> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const activity = await prisma.mantis_user_activity_log_table.create({
      data: {
        user_id: params.userId,
        action_type: params.actionType,
        description: params.description,
        old_value: params.oldValue || null,
        new_value: params.newValue || null,
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
        date_created: timestamp,
      },
    });

    logger.log(
      `User activity logged: user=${params.userId}, action=${params.actionType}, id=${activity.id}`
    );

    return activity.id;
  } catch (error) {
    logger.error("Failed to log user activity:", error);
    // Don't throw - activity logging shouldn't break the main flow
    return 0;
  }
}

/**
 * Helper to extract IP address from request headers
 */
export function getClientIp(headers: Headers): string | undefined {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    undefined
  );
}

/**
 * Helper to get user agent from request headers
 */
export function getUserAgent(headers: Headers): string | undefined {
  return headers.get("user-agent") || undefined;
}
