// /app/api/profile/filters/suggestions/[type]/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getSuggestedFilterValues, type FilterType } from "@/lib/notify/filters";

/**
 * GET /api/profile/filters/suggestions/:type - Get suggested filter values
 */
export async function GET(
  request: Request,
  { params }: { params: { type: string } }
) {
  try {
    const session = await requireSession();
    const filterType = params.type as FilterType;

    const validTypes = ["category", "priority", "severity", "tag", "project"];
    if (!validTypes.includes(filterType)) {
      return NextResponse.json(
        { error: "Invalid filter type" },
        { status: 400 }
      );
    }

    const suggestions = await getSuggestedFilterValues(session.uid, filterType);

    return NextResponse.json({
      filterType,
      count: suggestions.length,
      suggestions,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to get filter suggestions" },
      { status: 500 }
    );
  }
}
