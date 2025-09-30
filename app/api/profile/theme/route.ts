import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/db/client";

/**
 * GET /api/profile/theme - Get user's theme preference
 *
 * @returns User's theme setting (light|dark|system) or default "system"
 */
export async function GET() {
  try {
    const session = await requireSession();

    // Look up theme preference in config table
    const config = await prisma.mantis_config_table.findUnique({
      where: {
        config_id_project_id_user_id: {
          config_id: "nextbt_theme",
          project_id: 0, // Global setting
          user_id: session.uid,
        },
      },
    });

    const theme = config?.value || "system";

    return NextResponse.json({ theme });
  } catch (error) {
    console.error("Get theme error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve theme preference" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/profile/theme - Set user's theme preference
 *
 * @body { theme: "light" | "dark" | "system" }
 * @returns Success confirmation
 */
export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const body = await request.json();

    const { theme } = body;

    // Validate theme value
    if (!["light", "dark", "system"].includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme value. Must be light, dark, or system" },
        { status: 400 }
      );
    }

    // Upsert theme preference in config table
    await prisma.mantis_config_table.upsert({
      where: {
        config_id_project_id_user_id: {
          config_id: "nextbt_theme",
          project_id: 0, // Global setting
          user_id: session.uid,
        },
      },
      create: {
        config_id: "nextbt_theme",
        project_id: 0,
        user_id: session.uid,
        access_reqd: 0,
        type: 1, // String type
        value: theme,
      },
      update: {
        value: theme,
      },
    });

    return NextResponse.json({ success: true, theme });
  } catch (error) {
    console.error("Set theme error:", error);
    return NextResponse.json(
      { error: "Failed to save theme preference" },
      { status: 500 }
    );
  }
}