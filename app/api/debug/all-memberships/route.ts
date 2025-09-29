// /app/api/debug/all-memberships/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/db/client";

export async function GET() {
  const memberships = await prisma.mantis_project_user_list_table.findMany({
    take: 20,
    orderBy: { user_id: 'asc' }
  });

  const users = await prisma.mantis_user_table.findMany({
    take: 10,
    select: { id: true, username: true }
  });

  const projects = await prisma.mantis_project_table.findMany({
    take: 10,
    select: { id: true, name: true }
  });

  return NextResponse.json({
    memberships,
    users,
    projects
  });
}