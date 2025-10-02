export const dynamic = "force-dynamic";

// /app/api/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface UnifiedHistoryEntry {
  id: number;
  source: "bug_history" | "notification_history" | "user_activity";
  user_id: number;
  bug_id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  type: number;
  date_modified: number;
  // Notification history specific fields
  recipient?: string | null;
  subject?: string | null;
  channel?: string | null;
  status?: string | null;
  error_message?: string | null;
  // User activity specific fields
  description?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

export async function GET(req: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const bugId = searchParams.get("bug_id");
    const userId = searchParams.get("user_id");
    const fieldName = searchParams.get("field_name");
    const source = searchParams.get("source"); // "bug_history" or "email_audit"

    // Sorting parameters
    const sortBy = searchParams.get("sort_by") || "date_modified";
    const sortOrder = searchParams.get("sort_order") || "desc";

    // Validate sort parameters to prevent SQL injection
    const allowedSortFields = ["id", "date_modified", "bug_id", "user_id", "field_name", "type"];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : "date_modified";
    const validSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Build where conditions for SQL
    const conditions: string[] = [];
    const whereParams: any[] = [];

    if (bugId) {
      conditions.push("bug_id = ?");
      whereParams.push(parseInt(bugId, 10));
    }
    if (userId) {
      conditions.push("user_id = ?");
      whereParams.push(parseInt(userId, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Fetch data from each table separately to avoid collation issues with UNION
    const offset = (page - 1) * limit;

    // Build individual queries
    const bugHistoryQuery = `
      SELECT
        id,
        user_id,
        bug_id,
        field_name,
        old_value,
        new_value,
        type,
        date_modified
      FROM mantis_bug_history_table
      ${whereClause}
      ${fieldName ? (whereClause ? "AND" : "WHERE") + " field_name = ?" : ""}
    `;

    const notificationHistoryQuery = `
      SELECT
        id,
        user_id,
        bug_id,
        event_type,
        subject,
        date_sent,
        JSON_UNQUOTE(JSON_EXTRACT(channels_sent, '$[0]')) as channel,
        read_status
      FROM mantis_notification_history_table
      ${whereClause}
    `;

    const userActivityQuery = `
      SELECT
        id,
        user_id,
        action_type,
        old_value,
        new_value,
        description,
        ip_address,
        user_agent,
        date_created
      FROM mantis_user_activity_log_table
      ${conditions.length > 0 ? `WHERE ${conditions.filter(c => c.includes('user_id')).join(' AND ')}` : ''}
    `;

    // Execute queries in parallel
    const [bugHistoryRaw, notificationHistoryRaw, userActivityRaw] = await Promise.all([
      prisma.$queryRawUnsafe<any[]>(
        bugHistoryQuery,
        ...whereParams,
        ...(fieldName ? [fieldName] : [])
      ),
      prisma.$queryRawUnsafe<any[]>(
        notificationHistoryQuery,
        ...whereParams
      ),
      prisma.$queryRawUnsafe<any[]>(
        userActivityQuery,
        ...(conditions.length > 0 ? whereParams.filter((_, i) => conditions[i]?.includes('user_id')) : [])
      )
    ]);

    // Transform each result set into common format
    const bugHistory = bugHistoryRaw.map(entry => ({
      id: Number(entry.id),
      source: 'bug_history' as const,
      user_id: Number(entry.user_id),
      bug_id: Number(entry.bug_id),
      field_name: entry.field_name,
      old_value: entry.old_value,
      new_value: entry.new_value,
      type: Number(entry.type),
      date_modified: Number(entry.date_modified),
      recipient: null,
      subject: null,
      channel: null,
      status: null,
      error_message: null,
      description: null,
      ip_address: null,
      user_agent: null,
    }));

    const notificationHistory = notificationHistoryRaw.map(entry => ({
      id: Number(entry.id),
      source: 'notification_history' as const,
      user_id: Number(entry.user_id),
      bug_id: Number(entry.bug_id),
      field_name: entry.event_type,
      old_value: '',
      new_value: entry.subject,
      type: 0,
      date_modified: Number(entry.date_sent),
      recipient: null,
      subject: entry.subject,
      channel: entry.channel,
      status: entry.read_status === 1 ? 'read' : 'unread',
      error_message: null,
      description: null,
      ip_address: null,
      user_agent: null,
    }));

    const userActivity = userActivityRaw.map(entry => ({
      id: Number(entry.id),
      source: 'user_activity' as const,
      user_id: Number(entry.user_id),
      bug_id: 0,
      field_name: entry.action_type,
      old_value: entry.old_value || '',
      new_value: entry.new_value || '',
      type: 0,
      date_modified: Number(entry.date_created),
      recipient: null,
      subject: null,
      channel: null,
      status: null,
      error_message: null,
      description: entry.description,
      ip_address: entry.ip_address,
      user_agent: entry.user_agent,
    }));

    // Combine all results
    const rawHistory = [...bugHistory, ...notificationHistory, ...userActivity];

    // Sort by date_modified
    rawHistory.sort((a, b) => {
      if (validSortBy === 'date_modified') {
        return validSortOrder === 'DESC' ? b.date_modified - a.date_modified : a.date_modified - b.date_modified;
      }
      return 0;
    });

    // Apply pagination
    const paginatedHistory = rawHistory.slice(offset, offset + limit);

    // Use paginatedHistory for the response
    const history: UnifiedHistoryEntry[] = paginatedHistory;

    // Total is the combined length before pagination
    const total = rawHistory.length;

    // Fetch related user and bug data
    // Convert BigInt to number for Prisma compatibility
    const userIds = Array.from(new Set(history.map((h) => Number(h.user_id))));
    const bugIds = Array.from(new Set(history.map((h) => Number(h.bug_id))));

    const [users, bugs] = await Promise.all([
      prisma.mantis_user_table.findMany({
        where: { id: { in: userIds } },
        select: { id: true, username: true, realname: true },
      }),
      prisma.mantis_bug_table.findMany({
        where: { id: { in: bugIds } },
        select: { id: true, summary: true, project_id: true },
      }),
    ]);

    // Create lookup maps
    const userMap = new Map(users.map((u) => [u.id, u]));
    const bugMap = new Map(bugs.map((b) => [b.id, b]));

    // Enrich history entries with related data
    const enrichedHistory = history.map((entry) => ({
      ...entry,
      user: userMap.get(entry.user_id) || null,
      bug: bugMap.get(entry.bug_id) || null,
    }));

    return NextResponse.json({
      data: enrichedHistory,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error fetching unified history:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
