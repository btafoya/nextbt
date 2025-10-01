export const dynamic = "force-dynamic";

// /app/api/history/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { requireAdmin } from "@/lib/auth";
import { logger } from "@/lib/logger";

interface UnifiedHistoryEntry {
  id: number;
  source: "bug_history" | "email_audit";
  user_id: number;
  bug_id: number;
  field_name: string;
  old_value: string;
  new_value: string;
  type: number;
  date_modified: number;
  // Email audit specific fields
  recipient?: string;
  subject?: string;
  channel?: string;
  status?: string;
  error_message?: string;
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

    // Build where conditions for SQL
    const conditions: string[] = [];
    const params: any[] = [];

    if (bugId) {
      conditions.push("bug_id = ?");
      params.push(parseInt(bugId, 10));
    }
    if (userId) {
      conditions.push("user_id = ?");
      params.push(parseInt(userId, 10));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Use raw SQL for UNION query
    const offset = (page - 1) * limit;

    let unionQuery = `
      SELECT
        id,
        'bug_history' as source,
        user_id,
        bug_id,
        field_name,
        old_value,
        new_value,
        type,
        date_modified,
        NULL as recipient,
        NULL as subject,
        NULL as channel,
        NULL as status,
        NULL as error_message
      FROM mantis_bug_history_table
      ${whereClause}
      ${fieldName ? (whereClause ? "AND" : "WHERE") + " field_name = ?" : ""}

      UNION ALL

      SELECT
        id,
        'email_audit' as source,
        user_id,
        bug_id,
        'email_notification' as field_name,
        '' as old_value,
        recipient as new_value,
        0 as type,
        date_sent as date_modified,
        recipient,
        subject,
        channel,
        status,
        error_message
      FROM mantis_email_audit_table
      ${whereClause}

      ORDER BY date_modified DESC
      LIMIT ? OFFSET ?
    `;

    if (fieldName) {
      params.push(fieldName);
    }
    params.push(limit, offset);

    // Execute the UNION query
    const history = await prisma.$queryRawUnsafe<UnifiedHistoryEntry[]>(
      unionQuery,
      ...params
    );

    // Get total count using UNION for accurate pagination
    let countQuery = `
      SELECT COUNT(*) as total FROM (
        SELECT id FROM mantis_bug_history_table ${whereClause} ${fieldName ? (whereClause ? "AND" : "WHERE") + " field_name = ?" : ""}
        UNION ALL
        SELECT id FROM mantis_email_audit_table ${whereClause}
      ) as combined
    `;

    const countParams = [...params.slice(0, -2)]; // Remove limit and offset
    const countResult = await prisma.$queryRawUnsafe<[{ total: bigint }]>(
      countQuery,
      ...countParams
    );
    const total = Number(countResult[0]?.total || 0);

    // Fetch related user and bug data
    const userIds = Array.from(new Set(history.map((h) => h.user_id)));
    const bugIds = Array.from(new Set(history.map((h) => h.bug_id)));

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
