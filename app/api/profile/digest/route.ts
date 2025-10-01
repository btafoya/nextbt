// /app/api/profile/digest/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  getDigestPreferences,
  updateDigestPreferences,
  getUserQueuedNotifications,
} from "@/lib/notify/digest";

/**
 * GET /api/profile/digest - Get user's digest preferences
 */
export async function GET() {
  try {
    const session = await requireSession();
    const preferences = await getDigestPreferences(session.uid);

    return NextResponse.json({
      preferences: preferences || {
        enabled: false,
        frequency: "daily",
        timeOfDay: 9,
        dayOfWeek: 1,
        minNotifications: 1,
        includeChannels: ["email"],
      },
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get digest preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/profile/digest - Update digest preferences
 */
export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const {
      enabled,
      frequency,
      timeOfDay,
      dayOfWeek,
      minNotifications,
      includeChannels,
    } = body;

    // Validate input
    if (frequency && !["hourly", "daily", "weekly"].includes(frequency)) {
      return NextResponse.json(
        { error: "Invalid frequency value" },
        { status: 400 }
      );
    }

    if (timeOfDay !== undefined && (timeOfDay < 0 || timeOfDay > 23)) {
      return NextResponse.json(
        { error: "timeOfDay must be between 0 and 23" },
        { status: 400 }
      );
    }

    if (dayOfWeek !== undefined && (dayOfWeek < 1 || dayOfWeek > 7)) {
      return NextResponse.json(
        { error: "dayOfWeek must be between 1 and 7" },
        { status: 400 }
      );
    }

    await updateDigestPreferences(session.uid, {
      enabled,
      frequency,
      timeOfDay,
      dayOfWeek,
      minNotifications,
      includeChannels,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update digest preferences" },
      { status: 500 }
    );
  }
}
