// /app/api/debug/user-details/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";

export async function GET() {
  const users = await prisma.mantis_user_table.findMany({
    select: {
      id: true,
      username: true,
      access_level: true,
      email: true
    },
    orderBy: { id: 'asc' },
    take: 10
  });

  return NextResponse.json({ users });
}