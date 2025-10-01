// /app/api/profile/filters/[id]/route.ts
import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import {
  updateNotificationFilter,
  deleteNotificationFilter,
} from "@/lib/notify/filters";

/**
 * PUT /api/profile/filters/:id - Update notification filter
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession();
    const filterId = parseInt(params.id);

    if (isNaN(filterId)) {
      return NextResponse.json(
        { error: "Invalid filter ID" },
        { status: 400 }
      );
    }

    const body = await request.json();

    await updateNotificationFilter(filterId, body);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to update notification filter" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/filters/:id - Delete notification filter
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireSession();
    const filterId = parseInt(params.id);

    if (isNaN(filterId)) {
      return NextResponse.json(
        { error: "Invalid filter ID" },
        { status: 400 }
      );
    }

    await deleteNotificationFilter(filterId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to delete notification filter" },
      { status: 500 }
    );
  }
}
