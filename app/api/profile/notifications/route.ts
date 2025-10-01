export const dynamic = "force-dynamic";

// /app/api/profile/notifications/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await requireSession();

    // Get user's notification preferences
    const prefs = await prisma.mantis_user_pref_table.findFirst({
      where: {
        user_id: session.uid,
        project_id: 0 // 0 = global preferences
      },
      select: {
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
      }
    });

    // If no preferences exist, return defaults
    if (!prefs) {
      return NextResponse.json({
        email_on_new: 0,
        email_on_assigned: 0,
        email_on_feedback: 0,
        email_on_resolved: 0,
        email_on_closed: 0,
        email_on_reopened: 0,
        email_on_bugnote: 0,
        email_on_status: 0,
        email_on_priority: 0,
        email_on_new_min_severity: 10,
        email_on_assigned_min_severity: 10,
        email_on_feedback_min_severity: 10,
        email_on_resolved_min_severity: 10,
        email_on_closed_min_severity: 10,
        email_on_reopened_min_severity: 10,
        email_on_bugnote_min_severity: 10,
        email_on_status_min_severity: 10,
        email_on_priority_min_severity: 10,
      });
    }

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("Error fetching notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification preferences" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = await req.json();

    // Validate boolean fields (0 or 1)
    const booleanFields = [
      'email_on_new',
      'email_on_assigned',
      'email_on_feedback',
      'email_on_resolved',
      'email_on_closed',
      'email_on_reopened',
      'email_on_bugnote',
      'email_on_status',
      'email_on_priority'
    ];

    const severityFields = [
      'email_on_new_min_severity',
      'email_on_assigned_min_severity',
      'email_on_feedback_min_severity',
      'email_on_resolved_min_severity',
      'email_on_closed_min_severity',
      'email_on_reopened_min_severity',
      'email_on_bugnote_min_severity',
      'email_on_status_min_severity',
      'email_on_priority_min_severity'
    ];

    // Build update data
    const updateData: any = {};

    for (const field of booleanFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] ? 1 : 0;
      }
    }

    for (const field of severityFields) {
      if (body[field] !== undefined) {
        const value = parseInt(body[field], 10);
        if (isNaN(value) || value < 10 || value > 80) {
          return NextResponse.json(
            { error: `Invalid severity value for ${field}` },
            { status: 400 }
          );
        }
        updateData[field] = value;
      }
    }

    // Check if preferences exist
    const existing = await prisma.mantis_user_pref_table.findFirst({
      where: {
        user_id: session.uid,
        project_id: 0
      }
    });

    if (existing) {
      // Update existing preferences
      await prisma.mantis_user_pref_table.update({
        where: { id: existing.id },
        data: updateData
      });
    } else {
      // Create new preferences
      await prisma.mantis_user_pref_table.create({
        data: {
          user_id: session.uid,
          project_id: 0,
          ...updateData
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    return NextResponse.json(
      { error: "Failed to update notification preferences" },
      { status: 500 }
    );
  }
}
