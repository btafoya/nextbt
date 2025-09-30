export const dynamic = "force-dynamic";

// /app/api/debug/session/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/db/client";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No session" }, { status: 401 });

  const user = await prisma.mantis_user_table.findUnique({
    where: { id: session.uid }
  });

  const memberships = await prisma.mantis_project_user_list_table.findMany({
    where: { user_id: session.uid }
  });

  const projectIds = memberships.map(m => m.project_id);

  const projects = await prisma.mantis_project_table.findMany({
    where: { id: { in: projectIds } }
  });

  return NextResponse.json({
    session,
    user: { id: user?.id, username: user?.username, email: user?.email },
    memberships,
    projects: projects.map(p => ({ id: p.id, name: p.name }))
  });
}