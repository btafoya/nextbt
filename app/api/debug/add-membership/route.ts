// /app/api/debug/add-membership/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";

export async function POST(req: Request) {
  const { userId, projectId, accessLevel } = await req.json();

  const membership = await prisma.mantis_project_user_list_table.create({
    data: {
      user_id: userId,
      project_id: projectId,
      access_level: accessLevel || 25 // 25 = REPORTER level
    }
  });

  return NextResponse.json({ success: true, membership });
}