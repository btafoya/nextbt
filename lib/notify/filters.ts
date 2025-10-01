// /lib/notify/filters.ts
import "server-only";
import { prisma } from "@/db/client";
import { logger } from "@/lib/logger";

export type FilterType = "category" | "priority" | "severity" | "tag" | "project" | "custom";
export type FilterAction = "notify" | "ignore" | "digest_only";

export interface NotificationFilter {
  id?: number;
  userId: number;
  projectId: number;
  enabled: boolean;
  filterType: FilterType;
  filterValue: string;
  action: FilterAction;
  channels: string[];
}

export interface FilterMatch {
  matched: boolean;
  action: FilterAction;
  channels: string[];
  reason: string;
}

/**
 * Create a new notification filter
 */
export async function createNotificationFilter(
  filter: Omit<NotificationFilter, "id">
): Promise<number> {
  try {
    const timestamp = Math.floor(Date.now() / 1000);

    const created = await prisma.mantis_notification_filter_table.create({
      data: {
        user_id: filter.userId,
        project_id: filter.projectId,
        enabled: filter.enabled ? 1 : 0,
        filter_type: filter.filterType,
        filter_value: filter.filterValue,
        action: filter.action,
        channels: filter.channels,
        date_created: timestamp,
        date_modified: timestamp,
      },
    });

    logger.log(`Created notification filter ${created.id} for user ${filter.userId}`);
    return created.id;
  } catch (error) {
    logger.error("Failed to create notification filter:", error);
    throw error;
  }
}

/**
 * Update notification filter
 */
export async function updateNotificationFilter(
  filterId: number,
  updates: Partial<Omit<NotificationFilter, "id" | "userId">>
): Promise<void> {
  try {
    const data: any = {
      date_modified: Math.floor(Date.now() / 1000),
    };

    if (updates.enabled !== undefined) {
      data.enabled = updates.enabled ? 1 : 0;
    }
    if (updates.filterType) {
      data.filter_type = updates.filterType;
    }
    if (updates.filterValue !== undefined) {
      data.filter_value = updates.filterValue;
    }
    if (updates.action) {
      data.action = updates.action;
    }
    if (updates.channels) {
      data.channels = updates.channels;
    }
    if (updates.projectId !== undefined) {
      data.project_id = updates.projectId;
    }

    await prisma.mantis_notification_filter_table.update({
      where: { id: filterId },
      data,
    });

    logger.log(`Updated notification filter ${filterId}`);
  } catch (error) {
    logger.error("Failed to update notification filter:", error);
    throw error;
  }
}

/**
 * Delete notification filter
 */
export async function deleteNotificationFilter(filterId: number): Promise<void> {
  try {
    await prisma.mantis_notification_filter_table.delete({
      where: { id: filterId },
    });

    logger.log(`Deleted notification filter ${filterId}`);
  } catch (error) {
    logger.error("Failed to delete notification filter:", error);
    throw error;
  }
}

/**
 * Get user's notification filters
 */
export async function getUserNotificationFilters(
  userId: number,
  projectId?: number
): Promise<NotificationFilter[]> {
  const where: any = { user_id: userId };

  if (projectId !== undefined) {
    where.project_id = projectId;
  }

  const filters = await prisma.mantis_notification_filter_table.findMany({
    where,
    orderBy: { date_created: "desc" },
  });

  return filters.map((f) => ({
    id: f.id,
    userId: f.user_id,
    projectId: f.project_id,
    enabled: f.enabled === 1,
    filterType: f.filter_type as FilterType,
    filterValue: f.filter_value,
    action: f.action as FilterAction,
    channels: (f.channels as string[]) || [],
  }));
}

/**
 * Check if notification matches user's filters
 */
export async function checkNotificationFilters(
  userId: number,
  projectId: number,
  issue: {
    categoryId: number;
    priority: number;
    severity: number;
    tags?: string[];
  }
): Promise<FilterMatch> {
  try {
    // Get user's active filters for this project (and global filters)
    const filters = await prisma.mantis_notification_filter_table.findMany({
      where: {
        user_id: userId,
        project_id: { in: [0, projectId] }, // 0 = global, specific project ID
        enabled: 1,
      },
      orderBy: { date_created: "desc" }, // Later filters take precedence
    });

    // Default: no match (allow notification)
    let result: FilterMatch = {
      matched: false,
      action: "notify",
      channels: [],
      reason: "No matching filters",
    };

    // Check each filter
    for (const filter of filters) {
      const match = matchesFilter(filter, issue);

      if (match) {
        result = {
          matched: true,
          action: filter.action as FilterAction,
          channels: (filter.channels as string[]) || [],
          reason: `Matched ${filter.filter_type} filter: ${filter.filter_value}`,
        };

        // If action is "ignore", stop processing (highest priority)
        if (filter.action === "ignore") {
          break;
        }
      }
    }

    return result;
  } catch (error) {
    logger.error("Failed to check notification filters:", error);
    // On error, default to allowing notifications
    return {
      matched: false,
      action: "notify",
      channels: [],
      reason: "Filter check error",
    };
  }
}

/**
 * Check if issue matches a specific filter
 */
function matchesFilter(
  filter: any,
  issue: {
    categoryId: number;
    priority: number;
    severity: number;
    tags?: string[];
  }
): boolean {
  switch (filter.filter_type) {
    case "category":
      return String(issue.categoryId) === filter.filter_value;

    case "priority":
      // Filter value can be exact or range (e.g., "30" or "30-60")
      if (filter.filter_value.includes("-")) {
        const [min, max] = filter.filter_value.split("-").map(Number);
        return issue.priority >= min && issue.priority <= max;
      }
      return String(issue.priority) === filter.filter_value;

    case "severity":
      // Filter value can be exact or range
      if (filter.filter_value.includes("-")) {
        const [min, max] = filter.filter_value.split("-").map(Number);
        return issue.severity >= min && issue.severity <= max;
      }
      return String(issue.severity) === filter.filter_value;

    case "tag":
      // Check if issue has the specified tag
      if (!issue.tags || issue.tags.length === 0) {
        return false;
      }
      return issue.tags.some(
        (tag) => tag.toLowerCase() === filter.filter_value.toLowerCase()
      );

    case "custom":
      // Custom filters would require additional logic
      return false;

    default:
      return false;
  }
}

/**
 * Apply filters to notification recipient list
 */
export async function applyNotificationFilters(
  recipients: Array<{ userId: number }>,
  projectId: number,
  issue: {
    categoryId: number;
    priority: number;
    severity: number;
    tags?: string[];
  }
): Promise<{
  notify: number[];
  ignore: number[];
  digestOnly: number[];
  channelOverrides: Map<number, string[]>;
}> {
  const notify: number[] = [];
  const ignore: number[] = [];
  const digestOnly: number[] = [];
  const channelOverrides = new Map<number, string[]>();

  for (const recipient of recipients) {
    const filterMatch = await checkNotificationFilters(
      recipient.userId,
      projectId,
      issue
    );

    switch (filterMatch.action) {
      case "notify":
        notify.push(recipient.userId);
        if (filterMatch.channels.length > 0) {
          channelOverrides.set(recipient.userId, filterMatch.channels);
        }
        break;

      case "ignore":
        ignore.push(recipient.userId);
        break;

      case "digest_only":
        digestOnly.push(recipient.userId);
        break;
    }
  }

  logger.log(
    `Applied filters: ${notify.length} notify, ${ignore.length} ignore, ${digestOnly.length} digest-only`
  );

  return { notify, ignore, digestOnly, channelOverrides };
}

/**
 * Get suggested filter values based on user's issue history
 */
export async function getSuggestedFilterValues(
  userId: number,
  filterType: FilterType
): Promise<Array<{ value: string; count: number; label: string }>> {
  try {
    // Get user's projects
    const userProjects = await prisma.mantis_project_user_list_table.findMany({
      where: { user_id: userId },
      select: { project_id: true },
    });

    const projectIds = userProjects.map((p) => p.project_id);

    if (projectIds.length === 0) {
      return [];
    }

    switch (filterType) {
      case "category": {
        // Get categories from user's issues
        const categories = await prisma.$queryRaw<
          Array<{ category_id: number; count: number; name: string }>
        >`
          SELECT b.category_id, COUNT(*) as count, c.name
          FROM mantis_bug_table b
          LEFT JOIN mantis_category_table c ON b.category_id = c.id
          WHERE b.project_id IN (${projectIds.join(",")})
          GROUP BY b.category_id, c.name
          ORDER BY count DESC
          LIMIT 10
        `;

        return categories.map((c) => ({
          value: String(c.category_id),
          count: Number(c.count),
          label: c.name || `Category ${c.category_id}`,
        }));
      }

      case "priority": {
        const priorities = await prisma.$queryRaw<
          Array<{ priority: number; count: number }>
        >`
          SELECT priority, COUNT(*) as count
          FROM mantis_bug_table
          WHERE project_id IN (${projectIds.join(",")})
          GROUP BY priority
          ORDER BY count DESC
        `;

        const priorityLabels: Record<number, string> = {
          10: "None",
          20: "Low",
          30: "Normal",
          40: "High",
          50: "Urgent",
          60: "Immediate",
        };

        return priorities.map((p) => ({
          value: String(p.priority),
          count: Number(p.count),
          label: priorityLabels[p.priority] || `Priority ${p.priority}`,
        }));
      }

      case "severity": {
        const severities = await prisma.$queryRaw<
          Array<{ severity: number; count: number }>
        >`
          SELECT severity, COUNT(*) as count
          FROM mantis_bug_table
          WHERE project_id IN (${projectIds.join(",")})
          GROUP BY severity
          ORDER BY count DESC
        `;

        const severityLabels: Record<number, string> = {
          10: "Feature",
          20: "Trivial",
          30: "Text",
          40: "Tweak",
          50: "Minor",
          60: "Major",
          70: "Crash",
          80: "Block",
        };

        return severities.map((s) => ({
          value: String(s.severity),
          count: Number(s.count),
          label: severityLabels[s.severity] || `Severity ${s.severity}`,
        }));
      }

      default:
        return [];
    }
  } catch (error) {
    logger.error("Failed to get suggested filter values:", error);
    return [];
  }
}

/**
 * Get filter statistics for user
 */
export async function getUserFilterStats(userId: number): Promise<{
  totalFilters: number;
  activeFilters: number;
  inactiveFilters: number;
  byAction: Record<string, number>;
  byType: Record<string, number>;
}> {
  const [total, active, inactive] = await Promise.all([
    prisma.mantis_notification_filter_table.count({ where: { user_id: userId } }),
    prisma.mantis_notification_filter_table.count({
      where: { user_id: userId, enabled: 1 },
    }),
    prisma.mantis_notification_filter_table.count({
      where: { user_id: userId, enabled: 0 },
    }),
  ]);

  const byActionResults = await prisma.mantis_notification_filter_table.groupBy({
    by: ["action"],
    where: { user_id: userId },
    _count: true,
  });

  const byTypeResults = await prisma.mantis_notification_filter_table.groupBy({
    by: ["filter_type"],
    where: { user_id: userId },
    _count: true,
  });

  const byAction: Record<string, number> = {};
  for (const result of byActionResults) {
    byAction[result.action] = result._count;
  }

  const byType: Record<string, number> = {};
  for (const result of byTypeResults) {
    byType[result.filter_type] = result._count;
  }

  return {
    totalFilters: total,
    activeFilters: active,
    inactiveFilters: inactive,
    byAction,
    byType,
  };
}
