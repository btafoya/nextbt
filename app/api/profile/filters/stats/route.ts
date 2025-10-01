// /app/api/profile/filters/stats/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getUserFilterStats } from "@/lib/notify/filters";

/**
 * GET /api/profile/filters/stats - Get filter statistics
 */
export async function GET() {
  try {
    const session = await requireSession();
    const stats = await getUserFilterStats(session.uid);

    return NextResponse.json(stats);
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get filter statistics" },
      { status: 500 }
    );
  }
}
