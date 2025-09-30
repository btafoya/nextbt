// /app/(dash)/projects/page.tsx
import Link from "next/link";
import { prisma } from "@/db/client";
import { requireSession } from "@/lib/auth";
import { DataTable } from "@/components/ui/data-table";
import { columns } from "./columns";
import { Button } from "@/components/ui/button";

// Disable caching to ensure real-time data updates
export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getProjects() {
  const session = await requireSession();

  // Check if user is admin
  const user = await prisma.mantis_user_table.findUnique({
    where: { id: session.uid },
    select: { access_level: true }
  });

  const isAdmin = user && user.access_level >= 90;

  const projects = await prisma.mantis_project_table.findMany({
    where: isAdmin ? {} : {
      id: { in: session.projects }
    },
    orderBy: { id: "desc" }
  });

  return projects;
}

export default async function ProjectsPage() {
  const session = await requireSession();
  const projects = await getProjects();
  const user = session.uid ? await prisma.mantis_user_table.findUnique({ where: { id: session.uid } }) : null;
  const isAdmin = user ? user.access_level >= 90 : false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        {isAdmin && (
          <Link href="/projects/new">
            <Button className="bg-blue-600 text-white hover:bg-blue-700">New Project</Button>
          </Link>
        )}
      </div>

      <DataTable
        columns={columns}
        data={projects}
        searchColumn="name"
        searchPlaceholder="Filter projects..."
      />
    </div>
  );
}